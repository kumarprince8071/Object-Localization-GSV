# app/utils/file_utils.py
import os

def save_temp_file(filename, content):
    save_path = os.path.join("temp_files", filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "wb") as f:
        f.write(content)
    return save_path

def remove_temp_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting temporary file {file_path}: {e}")
