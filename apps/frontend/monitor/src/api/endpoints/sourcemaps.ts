/**
 * SourceMap 相关 API
 */

import { client } from '../client'

export const sourcemapsAPI = {
    /**
     * 上传 SourceMap 文件
     * 后端返回: { success: true, data: { fileId: string, release: string, appId: string } }
     * 响应拦截器解包后: { fileId: string, release: string, appId: string }
     */
    upload: (data: { file: File; release: string; appId: string; urlPrefix?: string }) => {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('release', data.release)
        formData.append('appId', data.appId)
        if (data.urlPrefix) {
            formData.append('urlPrefix', data.urlPrefix)
        }

        return client.post<{ fileId: string; release: string; appId: string }>('/sourcemaps/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}
