import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def get_user_by_token(cur, token):
    if not token:
        return None
    safe = token.replace("'", "''")
    cur.execute(f"SELECT id, username, rank, is_owner, chat_disabled FROM users WHERE token = '{safe}' AND is_hidden = FALSE")
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''
    Личные чаты между сотрудником и владельцем DezeYT.
    GET?with=USER_ID — история переписки.
    GET без параметров — список диалогов (для владельца).
    POST — отправить сообщение.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    me = get_user_by_token(cur, token)
    if not me:
        cur.close()
        conn.close()
        return {'statusCode': 401, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Нужна авторизация'})}

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        with_id = params.get('with')

        if not with_id and me['is_owner']:
            cur.execute(
                "SELECT DISTINCT ON (partner_id) partner_id, partner_username, message, created_at, is_read "
                "FROM ("
                "  SELECT "
                "    CASE WHEN from_user_id = {owner_id} THEN to_user_id ELSE from_user_id END AS partner_id,"
                "    CASE WHEN from_user_id = {owner_id} THEN (SELECT username FROM users WHERE id = to_user_id) "
                "         ELSE from_username END AS partner_username,"
                "    message, created_at,"
                "    CASE WHEN to_user_id = {owner_id} AND is_read = FALSE THEN TRUE ELSE FALSE END AS is_read "
                "  FROM private_messages WHERE from_user_id = {owner_id} OR to_user_id = {owner_id}"
                ") sub ORDER BY partner_id, created_at DESC".format(owner_id=me['id'])
            )
            dialogs = [{'partner_id': r['partner_id'], 'partner_username': r['partner_username'],
                        'last_message': r['message'], 'created_at': r['created_at'].isoformat(),
                        'has_unread': r['is_read']} for r in cur.fetchall()]
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'dialogs': dialogs})}

        if not with_id:
            cur.execute("SELECT id FROM users WHERE is_owner = TRUE LIMIT 1")
            owner = cur.fetchone()
            with_id = str(owner['id']) if owner else None

        if not with_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Не указан собеседник'})}

        wid = int(with_id)
        cur.execute(
            f"SELECT id, from_user_id, from_username, message, is_read, created_at "
            f"FROM private_messages "
            f"WHERE (from_user_id = {me['id']} AND to_user_id = {wid}) "
            f"   OR (from_user_id = {wid} AND to_user_id = {me['id']}) "
            f"ORDER BY created_at ASC LIMIT 200"
        )
        msgs = [{
            'id': r['id'], 'from_user_id': r['from_user_id'], 'from_username': r['from_username'],
            'message': r['message'], 'is_read': r['is_read'], 'created_at': r['created_at'].isoformat()
        } for r in cur.fetchall()]

        cur.execute(
            f"UPDATE private_messages SET is_read = TRUE "
            f"WHERE to_user_id = {me['id']} AND from_user_id = {wid} AND is_read = FALSE"
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'messages': msgs, 'me_id': me['id']})}

    if method == 'POST':
        if me['chat_disabled']:
            cur.close()
            conn.close()
            return {'statusCode': 403, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Чат заблокирован администратором'})}

        body = json.loads(event.get('body') or '{}')
        message = (body.get('message') or '').strip()
        to_id = body.get('to_user_id')

        if not message or not to_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Укажите сообщение и получателя'})}

        if len(message) > 2000:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Слишком длинное сообщение'})}

        if not me['is_owner']:
            cur.execute("SELECT id FROM users WHERE is_owner = TRUE LIMIT 1")
            owner = cur.fetchone()
            if not owner or int(to_id) != owner['id']:
                cur.close()
                conn.close()
                return {'statusCode': 403, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Сотрудники могут писать только владельцу'})}

        sm = message.replace("'", "''")
        su = me['username'].replace("'", "''")
        cur.execute(
            f"INSERT INTO private_messages (from_user_id, to_user_id, from_username, message) "
            f"VALUES ({me['id']}, {int(to_id)}, '{su}', '{sm}') RETURNING id, created_at"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'id': row['id'], 'created_at': row['created_at'].isoformat()})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})}
