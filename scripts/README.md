# CSV 转 JSON 转换工具

这个工具可以将 CSV 格式的学生名单转换为系统所需的 JSON 配置文件。

## 使用方法

### 基本用法

```bash
python3 scripts/csv_to_json.py <输入CSV文件> <输出JSON文件>
```

### 完整用法

```bash
python3 scripts/csv_to_json.py <输入CSV文件> <输出JSON文件> [选项]

选项:
  --title, -t <标题>    配置标题（默认: 学生抽选系统）
  --indent, -i <数字>   JSON 缩进空格数（默认: 2）
  --help, -h           显示帮助信息
```

## CSV 格式要求

### 必需列

- **姓名列**: 必须包含以下列名之一
  - `name` 或 `姓名`
  - `student` 或 `学生`

### 可选列

- **权重列**: 可包含以下列名之一
  - `weight` 或 `权重`
  - 如果不提供，默认为 `1.0`
  - 权重必须大于 0，否则会被重置为 `1.0`

- **ID 列**: 可包含以下列名之一
  - `id` 或 `student_id` 或 `学号`
  - 如果不提供，会自动生成（格式: `student-1`, `student-2`, ...）

### 分隔符

脚本会自动检测 CSV 文件的分隔符（逗号、制表符等）。

## 示例

### 示例 1: 基本 CSV（英文列名）

**students.csv**:
```csv
name,weight
张三,1.0
李四,2.0
王五,1.5
```

**转换命令**:
```bash
python3 scripts/csv_to_json.py students.csv output.json --title "三年级一班"
```

**输出 JSON**:
```json
{
  "title": "三年级一班",
  "students": [
    {
      "id": "student-1",
      "name": "张三",
      "weight": 1.0
    },
    {
      "id": "student-2",
      "name": "李四",
      "weight": 2.0
    },
    {
      "id": "student-3",
      "name": "王五",
      "weight": 1.5
    }
  ]
}
```

### 示例 2: 中文列名

**学生名单.csv**:
```csv
姓名,权重
张三,1.0
李四,2.0
王五,1.5
```

**转换命令**:
```bash
python3 scripts/csv_to_json.py 学生名单.csv output.json
```

### 示例 3: 包含自定义 ID

**students.csv**:
```csv
id,name,weight
2024001,张三,1.0
2024002,李四,2.0
2024003,王五,1.5
```

**转换命令**:
```bash
python3 scripts/csv_to_json.py students.csv output.json --title "2024级新生"
```

### 示例 4: 只有姓名（无权重）

**names.csv**:
```csv
name
张三
李四
王五
赵六
```

**转换命令**:
```bash
python3 scripts/csv_to_json.py names.csv output.json
```

所有学生的权重会自动设置为 `1.0`。

### 示例 5: 制表符分隔

脚本会自动检测制表符分隔的文件：

**students.tsv**:
```tsv
name	weight
张三	1.0
李四	2.0
```

**转换命令**:
```bash
python3 scripts/csv_to_json.py students.tsv output.json
```

## 快速测试

项目中包含了一个示例 CSV 文件，您可以直接测试：

```bash
# 转换示例文件
python3 scripts/csv_to_json.py scripts/example.csv public/students.json --title "示例班级"

# 在浏览器中加载
# 访问: http://localhost:5173/
# 输入 URL: http://localhost:5173/students.json
```

## 错误处理

脚本会检查以下错误：

1. **文件不存在**: 如果输入文件不存在，会显示错误信息
2. **缺少必需列**: 如果 CSV 没有姓名列，会提示错误
3. **空文件**: 如果没有找到有效的学生数据，会显示警告
4. **无效权重**: 如果权重不是数字或小于等于 0，会自动设置为 1.0

## 注意事项

1. CSV 文件必须使用 UTF-8 编码
2. 空行会被自动跳过
3. 姓名为空的行会被忽略
4. 输出目录会自动创建（如果不存在）

## 常见问题

### Q: 如何处理 Excel 文件？

A: 先在 Excel 中将文件另存为 CSV 格式，然后使用本脚本转换。

### Q: 权重的作用是什么？

A: 权重决定了学生被抽中的概率。权重越高，被抽中的概率越大。例如权重为 2.0 的学生被抽中的概率是权重为 1.0 的学生的两倍。

### Q: 可以批量转换多个文件吗？

A: 可以使用 shell 脚本批量处理：

```bash
for file in *.csv; do
    python3 scripts/csv_to_json.py "$file" "output/${file%.csv}.json"
done
```
