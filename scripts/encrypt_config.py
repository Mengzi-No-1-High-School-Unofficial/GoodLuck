#!/usr/bin/env python3
"""
JSON 配置文件加密工具

用法:
    python scripts/encrypt_config.py input.json output.encrypted.json

功能:
    - 读取明文 JSON 配置文件
    - 使用 AES-256-GCM 加密
    - 输出加密后的 JSON 文件
"""

import json
import base64
import os
import sys
import getpass
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    from cryptography.hazmat.primitives import hashes
except ImportError:
    print("错误: 缺少 cryptography 库", file=sys.stderr)
    print("请运行: pip install cryptography", file=sys.stderr)
    sys.exit(1)


def derive_key(password: str, salt: bytes) -> bytes:
    """从密码派生加密密钥"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,  # 256 bits
        salt=salt,
        iterations=100000,
    )
    return kdf.derive(password.encode('utf-8'))


def encrypt_data(data: str, password: str) -> dict:
    """加密数据"""
    # 生成随机盐值和 IV
    salt = os.urandom(16)
    iv = os.urandom(12)  # GCM 推荐 12 字节
    
    # 派生密钥
    key = derive_key(password, salt)
    
    # 加密
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(iv, data.encode('utf-8'), None)
    
    # 返回加密结果
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
    if len(sys.argv) != 3:
        print(f"用法: {sys.argv[0]} <输入JSON文件> <输出加密文件>", file=sys.stderr)
        print("\n示例:", file=sys.stderr)
        print(f"  {sys.argv[0]} students.json students.encrypted.json", file=sys.stderr)
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    # 检查输入文件
    if not input_file.exists():
        print(f"错误: 输入文件不存在: {input_file}", file=sys.stderr)
        sys.exit(1)
    
    # 读取输入文件
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            config_data = f.read()
        
        # 验证是否为有效 JSON
        json.loads(config_data)
    except json.JSONDecodeError as e:
        print(f"错误: 输入文件不是有效的 JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"错误: 读取文件失败: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 获取密码
    print(f"正在加密: {input_file}")
    password = get_password()
    
    # 加密
    try:
        encrypted = encrypt_data(config_data, password)
    except Exception as e:
        print(f"错误: 加密失败: {e}", file=sys.stderr)
        sys.exit(1)
    
    # 写入输出文件
    try:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(encrypted, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 加密成功: {output_file}")
        print(f"  算法: {encrypted['algorithm']}")
        print(f"  版本: {encrypted['version']}")
    except Exception as e:
        print(f"错误: 写入文件失败: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
