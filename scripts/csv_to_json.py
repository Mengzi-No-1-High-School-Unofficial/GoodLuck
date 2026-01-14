#!/usr/bin/env python3
"""
CSV 转 JSON 配置文件转换脚本

用法:
    python scripts/csv_to_json.py input.csv output.json [--title "班级名称"]

CSV 格式要求:
    - 第一行为表头（可选）
    - 必须包含 "name" 或 "姓名" 列
    - 可选包含 "weight" 或 "权重" 列（默认为 1.0）
    - 可选包含 "id" 列（如果没有会自动生成）

示例 CSV:
    name,weight
    张三,1.0
    李四,2.0
    王五,1.5
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any


def generate_id(index: int, name: str) -> str:
    """生成学生 ID"""
    return f"student-{index + 1}"


def parse_csv(csv_file: Path) -> List[Dict[str, Any]]:
    """解析 CSV 文件并返回学生列表"""
    students = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        # 尝试检测 CSV 格式
        sample = f.read(1024)
        f.seek(0)
        
        # 检测分隔符
        sniffer = csv.Sniffer()
        try:
            delimiter = sniffer.sniff(sample).delimiter
        except:
            delimiter = ','
        
        reader = csv.DictReader(f, delimiter=delimiter)
        
        # 检测列名（支持中英文）
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise ValueError("CSV 文件为空或格式错误")
        
        # 查找姓名列
        name_col = None
        for col in fieldnames:
            if col.lower() in ['name', '姓名', 'student', '学生']:
                name_col = col
                break
        
        if not name_col:
            raise ValueError("CSV 文件必须包含 'name' 或 '姓名' 列")
        
        # 查找权重列
        weight_col = None
        for col in fieldnames:
            if col.lower() in ['weight', '权重']:
                weight_col = col
                break
        
        # 查找 ID 列
        id_col = None
        for col in fieldnames:
            if col.lower() in ['id', 'student_id', '学号']:
                id_col = col
                break
        
        # 读取数据
        for index, row in enumerate(reader):
            name = row.get(name_col, '').strip()
            if not name:
                continue  # 跳过空行
            
            # 获取权重
            weight = 1.0
            if weight_col and row.get(weight_col):
                try:
                    weight = float(row[weight_col])
                    if weight <= 0:
                        weight = 1.0
                except ValueError:
                    weight = 1.0
            
            # 获取或生成 ID
            student_id = row.get(id_col, '').strip() if id_col else ''
            if not student_id:
                student_id = generate_id(index, name)
            
            students.append({
                'id': student_id,
                'name': name,
                'weight': weight
            })
    
    return students


def create_config(students: List[Dict[str, Any]], title: str = "学生抽选系统") -> Dict[str, Any]:
    """创建配置对象"""
    return {
        'title': title,
        'students': students
    }


def main():
    parser = argparse.ArgumentParser(
        description='将 CSV 格式的学生名单转换为 JSON 配置文件',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument('input', type=Path, help='输入的 CSV 文件路径')
    parser.add_argument('output', type=Path, help='输出的 JSON 文件路径')
    parser.add_argument('--title', '-t', default='学生抽选系统', help='配置标题（默认: 学生抽选系统）')
    parser.add_argument('--indent', '-i', type=int, default=2, help='JSON 缩进空格数（默认: 2）')
    
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
            print("警告: CSV 文件中没有找到有效的学生数据", file=sys.stderr)
            sys.exit(1)
        
        print(f"成功读取 {len(students)} 名学生")
        
        # 创建配置
        config = create_config(students, args.title)
        
        # 写入 JSON
        print(f"正在写入 JSON 文件: {args.output}")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=args.indent)
        
        print(f"✓ 转换成功！")
        print(f"  标题: {config['title']}")
        print(f"  学生数: {len(students)}")
        print(f"  输出文件: {args.output}")
        
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
