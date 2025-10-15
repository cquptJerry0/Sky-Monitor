import bcrypt from 'bcryptjs'

// 加密密码
const saltRounds = '$2a$10$j08v6qUb20lAUMyyG2d0TO' // 推荐盐的复杂度设置为10

export const encrypt = async (password: string) => bcrypt.hash(password, saltRounds)

export const encryptCompare = async (password: string, hash: string) => bcrypt.compare(password, hash)
