#!/usr/bin/env python3
"""
CSV 转加密配置文件工具

用法:
    python scripts/encrypt_csv.py input.csv output.encrypted.json [--title "标题"]

功能:
    - 读取 CSV 文件
    - 转换为 JSON 配置
    - 使用 AES-256-GCM 加密
    - 输出加密后的 JSON 文件
"""

import json
import sys
import argparse
import getpass
from pathlib import Path

# 导入 csv_to_json 的功能
from csv_to_json import parse_csv, create_config

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
    import os
    import base64
except ImportError:
    print("错误: 缺少 cryptography 库", file=sys.stderr)
    print("请运行: pip install cryptography", file=sys.stderr)
    sys.exit(1)


def derive_key(password: str, salt: bytes) -> bytes:
    """从密码派生加密密钥"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password.encode('utf-8'))


def encrypt_data(data: str, password: str) -> dict:
    """加密数据"""
    salt = os.urandom(16)
    iv = os.urandom(12)
    
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, data.encode('utf-8'), None)
    
    return {
        "encrypted": True,
        "version": "1.0",
        "algorithm": "AES-GCM",
        "data": base64.b64encode(ciphertext).decode('ascii'),
        "iv": base64.b64encode(iv).decode('ascii'),
        "salt": base64.b64encode(salt).decode('ascii')
    }


def get_password() -> str:
    """获取并确认密码"""
    while True:
        password = getpass.getpass("输入密码: ")
        if not password:
            print("错误: 密码不能为空", file=sys.stderr)
            continue
        
        if len(password) < 6:
            print("警告: 密码太短，建议至少 8 个字符", file=sys.stderr)
            confirm = input("是否继续? (y/N): ")
            if confirm.lower() != 'y':
                continue
        
        confirm_password = getpass.getpass("确认密码: ")
        if password != confirm_password:
            print("错误: 两次输入的密码不一致", file=sys.stderr)
            continue
        
        return password


def main():
    parser = argparse.ArgumentParser(
        description='将 CSV 文件转换为加密的 JSON 配置文件'
    )
    parser.add_argument('input', type=Path, help='输入的 CSV 文件路径')
    parser.add_argument('output', type=Path, help='输出的加密 JSON 文件路径')
    parser.add_argument('--title', '-t', default='学生抽选系统', help='配置标题')
    
    args = parser.parse_args()
    
    # 检查输入文件
    if not args.input.exists():
        print(f"错误: 输入文件不存在: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # 解析 CSV
        print(f"正在读取 CSV 文件: {args.input}")
        students = parse_csv(args.input)
        
        if not students:
            print("错误: CSV 文件中没有找到有效的学生数据", file=sys.stderr)
            sys.exit(1)
        
        print(f"成功读取 {len(students)} 名学生")
        
        # 创建配置
        config = create_config(students, args.title)
        config_json = json.dumps(config, ensure_ascii=False, indent=2)
        
        # 获取密码
        password = get_password()
        
        # 加密
        encrypted = encrypt_data(config_json, password)
        
        # 写入输出文件
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(encrypted, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 加密成功: {args.output}")
        print(f"  标题: {config['title']}")
        print(f"  学生数: {len(students)}")
        print(f"  算法: {encrypted['algorithm']}")
        
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
