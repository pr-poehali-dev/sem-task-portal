import json
import os
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
    cur.execute(f"SELECT id, username, rank, is_owner FROM users WHERE token = '{safe}' AND is_hidden = FALSE")
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    '''
    Задачи и уведомления портала Sem.
    PUT action=done_with_link — завершить со ссылкой на Яндекс Диск.
    PUT action=accept_task — владелец принимает и обнуляет задачу.
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
        if me['is_owner']:
            cur.execute(
                "SELECT t.id, t.title, t.description, t.target_rank, t.assigned_user_id, "
                "t.status, t.is_accepted, t.completion_link, t.created_at, u.username AS assigned_username "
                "FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id "
                "ORDER BY t.created_at DESC"
            )
        else:
            sr = me['rank'].replace("'", "''")
            cur.execute(
                f"SELECT t.id, t.title, t.description, t.target_rank, t.assigned_user_id, "
                f"t.status, t.is_accepted, t.completion_link, t.created_at, u.username AS assigned_username "
                f"FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id "
                f"WHERE t.target_rank = '{sr}' "
                f"AND t.status != 'cancelled' "
                f"AND t.is_accepted = FALSE "
                f"AND (t.assigned_user_id IS NULL OR t.assigned_user_id = {me['id']}) "
                f"ORDER BY t.created_at DESC"
            )
        rows = cur.fetchall()
        tasks = [{
            'id': r['id'], 'title': r['title'], 'description': r['description'],
            'target_rank': r['target_rank'], 'assigned_user_id': r['assigned_user_id'],
            'assigned_username': r['assigned_username'],
            'status': r['status'], 'is_accepted': r['is_accepted'],
            'completion_link': r['completion_link'],
            'created_at': r['created_at'].isoformat()
        } for r in rows]

        cur.execute(
            f"SELECT id, task_id, message, is_read, created_at FROM notifications "
            f"WHERE user_id = {me['id']} ORDER BY created_at DESC LIMIT 50"
        )
        nrows = cur.fetchall()
        notifications = [{
            'id': n['id'], 'task_id': n['task_id'], 'message': n['message'],
            'is_read': n['is_read'], 'created_at': n['created_at'].isoformat()
        } for n in nrows]

        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'tasks': tasks, 'notifications': notifications,
                                    'me': {'id': me['id'], 'username': me['username'],
                                           'rank': me['rank'], 'is_owner': me['is_owner']}})}

    if method == 'POST':
        if not me['is_owner']:
            cur.close()
            conn.close()
            return {'statusCode': 403, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Задачи создаёт только владелец'})}

        body = json.loads(event.get('body') or '{}')
        title = (body.get('title') or '').strip()
        description = (body.get('description') or '').strip()
        target_rank = (body.get('target_rank') or '').strip()
        assigned_user_id = body.get('assigned_user_id')

        if not title or not target_rank:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors_headers(),
                    'body': json.dumps({'error': 'Укажите название и ранг'})}

        st = title.replace("'", "''")
        sd = description.replace("'", "''")
        srank = target_rank.replace("'", "''")
        assign_sql = f"{int(assigned_user_id)}" if assigned_user_id else "NULL"

        cur.execute(
            f"INSERT INTO tasks (title, description, target_rank, assigned_user_id, created_by, status) "
            f"VALUES ('{st}', '{sd}', '{srank}', {assign_sql}, {me['id']}, 'new') RETURNING id"
        )
        task_id = cur.fetchone()['id']

        msg = f"Новый заказ: {title}".replace("'", "''")
        if assigned_user_id:
            cur.execute(
                f"INSERT INTO notifications (user_id, task_id, message) "
                f"VALUES ({int(assigned_user_id)}, {task_id}, '{msg}')"
            )
        else:
            cur.execute(
                f"INSERT INTO notifications (user_id, task_id, message) "
                f"SELECT id, {task_id}, '{msg}' FROM users WHERE rank = '{srank}' AND is_owner = FALSE AND is_hidden = FALSE"
            )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors_headers(),
                'body': json.dumps({'id': task_id})}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        if action == 'read_notifications':
            cur.execute(f"UPDATE notifications SET is_read = TRUE WHERE user_id = {me['id']}")
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'ok': True})}

        if action == 'cancel_task':
            if not me['is_owner']:
                cur.close()
                conn.close()
                return {'statusCode': 403, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Только владелец может отменять заказы'})}
            task_id = body.get('task_id')
            if not task_id:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Не указан заказ'})}
            cur.execute(f"UPDATE tasks SET status = 'cancelled' WHERE id = {int(task_id)}")
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'ok': True})}

        if action == 'done_with_link':
            task_id = body.get('task_id')
            link = (body.get('link') or '').strip()
            if not task_id:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Не указан заказ'})}
            sl = link.replace("'", "''")
            srank = me['rank'].replace("'", "''")
            cur.execute(
                f"UPDATE tasks SET status = 'done', assigned_user_id = {me['id']}, "
                f"completion_link = '{sl}' "
                f"WHERE id = {int(task_id)} AND target_rank = '{srank}' AND is_accepted = FALSE"
            )
            owner_msg = f"Заказ завершён: ".replace("'", "''")
            cur.execute(f"SELECT title FROM tasks WHERE id = {int(task_id)}")
            task_row = cur.fetchone()
            if task_row:
                title_s = task_row['title'].replace("'", "''")
                owner_msg = f"Заказ завершён: {task_row['title']}".replace("'", "''")
            cur.execute(
                f"INSERT INTO notifications (user_id, task_id, message) "
                f"SELECT id, {int(task_id)}, '{owner_msg}' FROM users WHERE is_owner = TRUE"
            )
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'ok': True})}

        if action == 'accept_task':
            if not me['is_owner']:
                cur.close()
                conn.close()
                return {'statusCode': 403, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Только владелец принимает заказы'})}
            task_id = body.get('task_id')
            if not task_id:
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Не указан заказ'})}
            cur.execute(f"UPDATE tasks SET is_accepted = TRUE, status = 'done' WHERE id = {int(task_id)} AND status = 'done'")
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'ok': True})}

        if action == 'update_status':
            task_id = body.get('task_id')
            status = (body.get('status') or '').strip()
            if not task_id or status not in ('new', 'in_progress', 'done'):
                cur.close()
                conn.close()
                return {'statusCode': 400, 'headers': cors_headers(),
                        'body': json.dumps({'error': 'Неверные данные'})}
            ss = status.replace("'", "''")
            if me['is_owner']:
                cur.execute(f"UPDATE tasks SET status = '{ss}' WHERE id = {int(task_id)}")
            else:
                srank = me['rank'].replace("'", "''")
                cur.execute(
                    f"UPDATE tasks SET status = '{ss}', assigned_user_id = {me['id']} "
                    f"WHERE id = {int(task_id)} AND target_rank = '{srank}'"
                )
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': cors_headers(),
                    'body': json.dumps({'ok': True})}

        cur.close()
        conn.close()
        return {'statusCode': 400, 'headers': cors_headers(),
                'body': json.dumps({'error': 'Неизвестное действие'})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors_headers(),
            'body': json.dumps({'error': 'Method not allowed'})}
