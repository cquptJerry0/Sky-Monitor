import React from 'react'
import { Navigate } from 'react-router-dom'

interface AuthRouteProps {
    children: JSX.Element
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (!accessToken && !refreshToken) {
        return <Navigate to={`account/login?redirect=${window.location.pathname}`} />
    }

    return children
}

export default AuthRoute
