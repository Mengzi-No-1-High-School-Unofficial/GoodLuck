import type { Config, Student } from './types';

/**
 * 加权随机抽选算法
 * @param students 学生列表
 * @returns 被抽中的学生
 */
export function weightedRandomPick(students: Student[]): Student | null {
    if (students.length === 0) return null;

    // 计算总权重
    const totalWeight = students.reduce((sum, student) => sum + student.weight, 0);

    // 生成随机数
    let random = Math.random() * totalWeight;

    // 根据权重选择学生
    for (const student of students) {
        random -= student.weight;
        if (random <= 0) {
            return student;
        }
    }

    // 兜底返回最后一个学生
    return students[students.length - 1] ?? null;
}

/**
 * 从 URL 加载配置文件
 * @param url 配置文件 URL
 * @returns 配置对象
 */
export async function loadConfigFromUrl(url: string): Promise<Config> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();

        // 验证配置格式
        if (!config.students || !Array.isArray(config.students)) {
            throw new Error('配置格式错误：缺少 students 数组');
        }

        // 验证每个学生的数据
        config.students.forEach((student: any, index: number) => {
            if (!student.id || !student.name) {
                throw new Error(`学生 ${index + 1} 数据不完整`);
            }
            if (typeof student.weight !== 'number' || student.weight <= 0) {
                student.weight = 1; // 默认权重为 1
            }
        });

        return config;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`加载配置失败: ${error.message}`);
        }
        throw new Error('加载配置失败: 未知错误');
    }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 保存配置到本地存储
 */
export function saveConfigToLocal(config: Config): void {
    localStorage.setItem('student-picker-config', JSON.stringify(config));
}

/**
 * 从本地存储加载配置
 */
export function loadConfigFromLocal(): Config | null {
    const stored = localStorage.getItem('student-picker-config');
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}
