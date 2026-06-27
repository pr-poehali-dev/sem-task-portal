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
    cur.execute(f"SELECT id, username, rank, is_owner FROM users WHERE token = '{safe}'")
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''
    Чат команды портала Sem.
    GET — получить последние 100 сообщений, POST — отправить сообщение.
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
        cur.execute(
            "SELECT id, user_id, username, message, created_at "
            "FROM chat_messages ORDER BY created_at ASC LIMIT 100"
        )
        rows = cur.fetchall()
        messages = [{
            'id': r['id'],
            'user_id': r['user_id'],
            'username': r['username'],
            'message': r['message'],
            'created_at': r['created_at'].isoformat(),
        } for r in rows]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'messages': messages, 'me_id': me['id']})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        message = (body.get('message') or '').strip()
        if not message:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Сообщение не может быть пустым'})}
        if len(message) > 1000:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Сообщение слишком длинное'})}

        sm = message.replace("'", "''")
        su = me['username'].replace("'", "''")
        cur.execute(
            f"INSERT INTO chat_messages (user_id, username, message) "
            f"VALUES ({me['id']}, '{su}', '{sm}') RETURNING id, created_at"
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({
                    'id': row['id'],
                    'created_at': row['created_at'].isoformat(),
                })}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})}
