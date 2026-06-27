import json
import os
import secrets
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def make_token() -> str:
    return secrets.token_hex(24)


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
    }


def handler(event: dict, context) -> dict:
    '''
    Авторизация пользователей портала Sem.
    Вход только для зарегистрированных. Возвращает токен и данные пользователя.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    username = (body.get('username') or '').strip()
    password = body.get('password') or ''

    if not username or not password:
        return {'statusCode': 400, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Введите логин и пароль'})}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    safe_username = username.replace("'", "''")
    cur.execute(f"SELECT id, username, password, rank, is_owner FROM users WHERE username = '{safe_username}'")
    user = cur.fetchone()

    if not user or user['password'] != password:
        cur.close()
        conn.close()
        return {'statusCode': 401, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Неверный логин или пароль'})}

    token = make_token()
    cur.execute(f"UPDATE users SET token = '{token}' WHERE id = {user['id']}")
    conn.commit()

    result = {
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'rank': user['rank'],
            'is_owner': user['is_owner'],
        }
    }
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': cors_headers(),
            'body': json.dumps(result)}
