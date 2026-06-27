import json
import os
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    Управление пользователями портала Sem.
    Только владелец DezeYT может создавать аккаунты и менять ранги.
    GET — список пользователей, POST — создать, PUT — изменить ранг.
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

    if not me['is_owner']:
        cur.close()
        conn.close()
        return {'statusCode': 403, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Доступ только для владельца'})}

    if method == 'GET':
        cur.execute("SELECT id, username, rank, is_owner, created_at FROM users ORDER BY id")
        rows = cur.fetchall()
        users = [{
            'id': r['id'], 'username': r['username'], 'rank': r['rank'],
            'is_owner': r['is_owner'], 'created_at': r['created_at'].isoformat()
        } for r in rows]
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'users': users})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        username = (body.get('username') or '').strip()
        password = body.get('password') or ''
        rank = (body.get('rank') or 'Программист').strip()

        if not username or not password:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Введите логин и пароль'})}

        su = username.replace("'", "''")
        cur.execute(f"SELECT id FROM users WHERE username = '{su}'")
        if cur.fetchone():
            cur.close()
            conn.close()
            return {'statusCode': 409, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Такой логин уже существует'})}

        sp = password.replace("'", "''")
        sr = rank.replace("'", "''")
        cur.execute(
            f"INSERT INTO users (username, password, rank, is_owner) "
            f"VALUES ('{su}', '{sp}', '{sr}', FALSE) RETURNING id, username, rank, is_owner"
        )
        new_user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'user': {
                    'id': new_user['id'], 'username': new_user['username'],
                    'rank': new_user['rank'], 'is_owner': new_user['is_owner']
                }})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        user_id = body.get('id')
        new_rank = (body.get('rank') or '').strip()
        new_password = body.get('password')

        if not user_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Не указан пользователь'})}

        updates = []
        if new_rank:
            sr = new_rank.replace("'", "''")
            updates.append(f"rank = '{sr}'")
        if new_password:
            sp = new_password.replace("'", "''")
            updates.append(f"password = '{sp}'")

        if not updates:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Нечего обновлять'})}

        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = {int(user_id)} AND is_owner = FALSE")
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'ok': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})}
