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
 * @param password 可选密码（用于解密加密配置）
 * @returns 配置对象
 */
export async function loadConfigFromUrl(url: string, password?: string): Promise<Config> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let config: Config;

        // 检查是否为加密配置
        if (isEncryptedConfig(data)) {
            if (!password) {
                throw new Error('此配置文件已加密，请输入密码');
            }

            // 解密配置
            const decryptedJson = await decryptConfig(
                data.data,
                data.iv,
                data.salt,
                password
            );
            config = JSON.parse(decryptedJson);
        } else {
            // 明文配置
            config = data;
        }

        // 验证配置格式
        if (!config.students && !config.groups) {
            throw new Error('配置格式错误：缺少 students 或 groups 数组');
        }

        // 统一处理学生数据验证和权重
        const processStudents = (students: any[]) => {
            students.forEach((student: any, index: number) => {
                if (!student.id || !student.name) {
                    throw new Error(`学生 ${index + 1} 数据不完整`);
                }
                if (typeof student.weight !== 'number' || student.weight <= 0) {
                    student.weight = 1; // 默认权重为 1
                }
            });
        };

        if (config.students) processStudents(config.students);
        if (config.groups) {
            config.groups.forEach(group => {
                if (!group.name || !Array.isArray(group.students)) {
                    throw new Error(`分组 ${group.name || '未知'} 格式错误`);
                }
                processStudents(group.students);
            });
        }

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
    const json = JSON.stringify(config);
    // 使用 btoa 进行 Base64 编码
    // 注意：btoa 只支持 ASCII。对于 UTF-8 字符（如中文名字），需要先进行转义
    const encoded = btoa(encodeURIComponent(json));
    localStorage.setItem('student-picker-config', encoded);
}

/**
 * 从本地存储加载配置
 */
export function loadConfigFromLocal(): Config | null {
    const stored = localStorage.getItem('student-picker-config');
    if (!stored) return null;

    try {
        // 首先尝试作为 Base64 解码
        try {
            const decoded = decodeURIComponent(atob(stored));
            return JSON.parse(decoded);
        } catch (e) {
            // 如果解码或解析失败，尝试直接作为 JSON 解析（向下兼容旧格式）
            return JSON.parse(stored);
        }
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

/**
 * 检查配置是否加密
 */
export function isEncryptedConfig(data: any): boolean {
    return (
        typeof data === 'object' &&
        data.encrypted === true &&
        typeof data.version === 'string' &&
        typeof data.algorithm === 'string' &&
        typeof data.data === 'string' &&
        typeof data.iv === 'string' &&
        typeof data.salt === 'string'
    );
}

/**
 * Base64 字符串转 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * 使用 Web Crypto API 解密配置
 */
export async function decryptConfig(
    encryptedData: string,
    iv: string,
    salt: string,
    password: string
): Promise<string> {
    try {
        // Base64 解码
        const ciphertext = base64ToArrayBuffer(encryptedData);
        const ivBuffer = base64ToArrayBuffer(iv);
        const saltBuffer = base64ToArrayBuffer(salt);

        // 派生密钥
        const passwordBuffer = new TextEncoder().encode(password);
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // 解密
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBuffer },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('解密失败：密码错误或文件已损坏');
    }
}
