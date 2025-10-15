import React from 'react'
import { Navigate } from 'react-router-dom'

interface AuthRouteProps {
    children: JSX.Element
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
    // 如果用户没有登录，重定向到登录页面
    if (!localStorage.getItem('token')) {
        return <Navigate to={`account/login?redirect=${window.location.pathname}`} />
    }

    // 如果用户已登录，渲染子组件
    return children
}

export default AuthRoute
