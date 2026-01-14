# 学生抽选系统

一个简洁美观的学生抽选系统，使用 Vue 3 + Vite + TailwindCSS 开发。

## 功能特性

✨ **核心功能**
- 🎯 加权随机抽选算法
- 🌐 从 URL 加载配置文件
- 💾 本地存储配置
- 📜 抽选历史记录
- 🎨 美观的界面设计

🎨 **界面设计**
- 深色主题渐变背景
- 玻璃态效果
- 流畅的动画效果
- 响应式布局

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:5173/ 即可使用。

### 构建生产版本

```bash
pnpm run build
```

## 使用说明

### 1. 加载配置

在输入框中输入配置文件的 URL，点击"加载配置"按钮。

**示例配置文件**: http://localhost:5173/example-config.json

### 2. 开始抽选

配置加载成功后，会显示学生列表。点击"开始抽选"按钮进行抽选。

### 3. 查看结果

抽选结果会以大字体显示，并自动记录到历史中。

### 4. 查看历史

所有抽选记录都会保存在历史记录中，显示抽中的学生和时间。

## 配置文件格式

配置文件必须是 JSON 格式，包含以下字段：

```json
{
  "title": "示例班级抽选",
  "students": [
    {
      "id": "student-1",
      "name": "张三",
      "weight": 1.0,
      "info": "一班"
    },
    {
      "id": "student-2",
      "name": "李四",
      "weight": 2.0,
      "info": "二班"
    },
    {
      "id": "student-3",
      "name": "王五",
      "weight": 1.5,
      "info": "一班"
    }
  ]
}
```

### 字段说明

- `title` (可选): 系统标题
- `students` (必需): 学生数组
  - `id` (必需): 学生唯一标识
  - `name` (必需): 学生姓名
  - `weight` (可选): 权重，默认为 1.0（权重越高，被抽中概率越大）
  - `info` (可选): 附属信息，如班级、组别等（仅在抽选结果中显示）

### 使用 CSV 转换工具

如果您有 Excel 或 CSV 格式的学生名单，可以使用我们提供的转换工具：

```bash
# 基本用法
python3 scripts/csv_to_json.py input.csv output.json

# 指定标题
python3 scripts/csv_to_json.py students.csv public/config.json --title "三年级一班"
```

CSV 文件格式示例：
```csv
name,weight
张三,1.0
李四,2.0
王五,1.5
```

详细使用说明请查看 [scripts/README.md](scripts/README.md)。

## 加权随机算法

系统使用加权随机算法确保抽选的公平性。每个学生被抽中的概率与其权重成正比。

例如：
- 张三权重 1.0
- 李四权重 2.0
- 王五权重 1.0

总权重 = 4.0

抽中概率：
- 张三: 1.0/4.0 = 25%
- 李四: 2.0/4.0 = 50%
- 王五: 1.0/4.0 = 25%

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: TailwindCSS
- **语言**: TypeScript

## 项目结构

```
src/
├── composables/        # 组合式函数
│   └── useStudents.ts      # 学生管理逻辑
├── types.ts            # TypeScript 类型定义
├── utils.ts            # 工具函数
├── App.vue             # 主应用组件
├── main.ts             # 应用入口
└── style.css           # 全局样式
```

## 本地存储

配置会自动保存到浏览器的 localStorage 中，刷新页面后配置不会丢失。

## 许可证

MPL 2.0
