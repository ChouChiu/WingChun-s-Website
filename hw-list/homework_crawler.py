import sys
import requests
from bs4 import BeautifulSoup
import csv
import os
import re
from datetime import datetime, timedelta
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

class Logger:
    @staticmethod
    def info(message):
        print(f"::notice::{message}")

    @staticmethod
    def success(message):
        print(f"::notice title=成功::{message}")

    @staticmethod
    def warning(message):
        print(f"::warning::{message}")

    @staticmethod
    def error(message):
        print(f"::error::{message}")

    @staticmethod
    def group(title):
        print(f"::group::{title}")

    @staticmethod
    def endgroup():
        print("::endgroup::")

def get_credentials():
    username = os.getenv('PORTAL_USERNAME')
    password = os.getenv('PORTAL_PASSWORD')

    if not username or not password:
        Logger.error("無法從環境變數取得登入憑證")
        Logger.error("請設定 PORTAL_USERNAME 和 PORTAL_PASSWORD 環境變數")
        return None, None

    Logger.info("成功從環境變數取得登入憑證")
    return username, password

def login_to_portal(username, password):
    login_url = "https://portal.frcss.edu.hk/user.php?op=login"
    session = requests.Session()

    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    try:
        Logger.info("正在登入...")
        login_data = {
            'uname': username,
            'pass': password,
            'op': 'login',
            'xoops_redirect': '',
            'from': 'profile'
        }

        response = session.post(login_url, data=login_data, timeout=(10, 30))

        if '登入' in response.text and '帳號' in response.text:
            Logger.error("登入失敗：用戶名稱或密碼錯誤")
            return None
        else:
            Logger.success("登入成功！")
            return session

    except requests.exceptions.Timeout:
        Logger.error("登入超時：連接或讀取超時")
        return None
    except requests.exceptions.ConnectionError:
        Logger.error("連接錯誤：無法連接到入口門戶")
        return None
    except Exception as e:
        Logger.error(f"登入過程中出現錯誤: {e}")
        return None

def clean_subject_name(subject_text):
    pattern = r'^(.+?)\s*--\s*([A-Za-z_]+)$'
    match = re.match(pattern, subject_text)

    if match:
        chinese_name = match.group(1).strip()
        english_code = match.group(2).strip().upper()

        if len(english_code) % 2 == 0:
            half_length = len(english_code) // 2
            if english_code[:half_length] == english_code[half_length:]:
                english_code = english_code[:half_length]

        return f"{chinese_name} -- {english_code}"

    # Handle cases like "其他z_etc" (no separator, internal code)
    split_match = re.match(r'^([\u4e00-\u9fff]+)[a-z_]+$', subject_text)
    if split_match:
        return split_match.group(1).strip()

    return subject_text

def get_homework_by_date(session, date_str):
    ajax_url = "https://portal.frcss.edu.hk/modules/clsrm/clsrm_hw_oper.php"

    data = {
        'oper': 'hw_tbl',
        'slt_term': '1',
        'slt_subj': '',
        'slt_date': date_str,
        'slt_tide': 'create'
    }

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://portal.frcss.edu.hk/modules/clsrm/?md=hw',
        'X-Requested-With': 'XMLHttpRequest',
    }

    try:
        Logger.info(f"正在取得 {date_str} 的家課資料...")
        response = session.post(ajax_url, data=data, headers=headers, timeout=(10, 30))

        if response.status_code != 200:
            Logger.error(f"請求失敗，狀態碼: {response.status_code}")
            return None

        try:
            result = response.json()
            html_content = result.get('html')
            if html_content:
                Logger.success(f"成功取得 {date_str} 的家課資料")
            else:
                Logger.info(f"{date_str} 沒有家課資料")
            return html_content
        except ValueError as e:
            Logger.error(f"JSON解析失敗: {e}")
            return None

    except requests.exceptions.Timeout:
        Logger.error(f"請求超時：取得 {date_str} 家課資料時連接或讀取超時")
        return None
    except requests.exceptions.ConnectionError:
        Logger.error(f"連接錯誤：無法連接到伺服器")
        return None
    except Exception as e:
        Logger.error(f"取得 {date_str} 家課資料失敗: {e}")
        return None

def parse_homework_data(html_content):
    if not html_content:
        return []

    soup = BeautifulSoup(html_content, 'html.parser')
    homework_data = []
    homework_table = soup.find('table', {'id': 'hw_table'})

    if homework_table:
        rows = homework_table.find_all('tr')[1:]
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 7:
                homework_data.append({
                    'id': cells[0].get_text(strip=True),
                    'issue_date': cells[1].get_text(strip=True),
                    'due_date': cells[2].get_text(strip=True),
                    'class_group': cells[3].get_text(strip=True),
                    'subject': clean_subject_name(cells[4].get_text(strip=True)),
                    'homework_name': cells[5].get_text(strip=True),
                    'remarks': cells[6].get_text(strip=True),
                })
        Logger.success(f"取得 {len(homework_data)} 條家課記錄")
    else:
        Logger.warning("未找到家課表格")

    return homework_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'public', 'hw-list')

def get_date_range():
    current_year = 2025
    start_date = datetime(current_year, 9, 1)
    end_date = datetime.now()

    date_list = []
    current_date = start_date
    while current_date <= end_date:
        date_list.append(current_date.strftime('%Y-%m-%d'))
        current_date += timedelta(days=1)

    return date_list

def save_data_to_csv(homework_data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filename = os.path.join(OUTPUT_DIR, 'homework_data.csv')
    if not homework_data:
        Logger.warning("沒有資料可儲存")
        return False

    try:
        fieldnames = ['id', 'issue_date', 'due_date', 'class_group', 'subject', 'homework_name', 'remarks']
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(homework_data)

        Logger.success(f"資料已儲存到 {filename}: {len(homework_data)} 條記錄")
        return True
    except Exception as e:
        Logger.error(f"儲存資料失敗: {e}")
        return False

def main():
    Logger.group("家課資料爬蟲開始執行")

    username, password = get_credentials()
    if not username or not password:
        return []

    session = login_to_portal(username, password)
    if not session:
        return []

    force_full_update = os.getenv('FORCE_FULL_UPDATE', 'false').lower() == 'true'

    if force_full_update:
        Logger.info("強制完整更新模式已啟用")

    today = datetime.now().strftime('%Y-%m-%d')

    data_file = os.path.join(OUTPUT_DIR, 'homework_data.csv')

    if force_full_update or not os.path.exists(data_file):
        Logger.info("取得從9月1日至現時的所有家課資料...")
        date_list = get_date_range()
        Logger.info(f"將查詢 {len(date_list)} 天的家課資料")

        homework_data = []
        for i, date_str in enumerate(date_list):
            if i % 10 == 0:
                Logger.info(f"查詢進度: {i+1}/{len(date_list)} - {date_str}")

            homework_html = get_homework_by_date(session, date_str)
            if homework_html:
                daily_homework = parse_homework_data(homework_html)
                homework_data.extend(daily_homework)

        Logger.success(f"完整更新完成，共取得 {len(homework_data)} 條記錄")

    else:
        Logger.info("增量更新模式")

        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                existing_data = list(reader)
            existing_ids = {item['id'] for item in existing_data if 'id' in item}
        except Exception as e:
            Logger.error(f"讀取現有資料失敗: {e}")
            existing_data = []
            existing_ids = set()

        homework_html = get_homework_by_date(session, today)
        new_homework = parse_homework_data(homework_html) if homework_html else []

        new_count = 0
        for item in new_homework:
            if item['id'] not in existing_ids:
                existing_data.append(item)
                new_count += 1

        homework_data = existing_data
        Logger.success(f"新增 {new_count} 條記錄，總計 {len(homework_data)} 條記錄")

    if homework_data:
        save_data_to_csv(homework_data)
        Logger.info(f"資料摘要:")
        Logger.info(f"  - 總記錄數: {len(homework_data)}")

        subject_counts = {}
        for item in homework_data:
            subject = item.get('subject', '未知')
            subject_counts[subject] = subject_counts.get(subject, 0) + 1

        Logger.info(f"  - 科目統計:")
        for subject, count in subject_counts.items():
            Logger.info(f"    - {subject}: {count} 項")

        today_dt = datetime.now()
        upcoming_count = 0
        for item in homework_data:
            due_date_str = item.get('due_date', '')
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
                if 0 <= (due_date - today_dt).days <= 3:
                    upcoming_count += 1
            except:
                pass

        if upcoming_count > 0:
            Logger.warning(f"有 {upcoming_count} 項作業在未來3天內到期")
    else:
        Logger.warning("沒有取得家課資料")

    Logger.endgroup()
    return homework_data

if __name__ == "__main__":
    start_time = datetime.now()
    homework_data = main()
    end_time = datetime.now()

    Logger.info(f"執行時間: {end_time - start_time}")
    Logger.info(f"完成狀態: {'成功' if homework_data else '失敗'}")

    Logger.group("環境資訊")
    Logger.info(f"執行時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    Logger.info(f"Python版本: {sys.version}")
    Logger.endgroup()
