/**
 * SourceMap 相关 API
 */

import { client } from '../client'

export const sourcemapsAPI = {
    /**
     * 上传 SourceMap 文件
     */
    upload: (data: { file: File; release: string; appId: string; urlPrefix?: string }) => {
        const formData = new FormData()
        formData.append('file', data.file)
        formData.append('release', data.release)
        formData.append('appId', data.appId)
        if (data.urlPrefix) {
            formData.append('urlPrefix', data.urlPrefix)
        }

        return client.post('/sourcemaps/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    },
}
