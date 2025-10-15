export function TaiJi() {
    return (
        <div className="absolute z-10 left-1/2 top-1/2 rotate-[180deg] -translate-x-[100px] -translate-y-[100px] scale-y-[-1] w-[200px] h-[200px]">
            <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                {/* <!-- 外圈大圆 --> */}
                <circle cx="100" cy="100" r="100" fill="hsl(var(--primary))" />

                {/* <!-- 白色半圆 --> */}
                <path d="M 100,0 A 100,100 0 0,1 100,200 A 50,50 0 0,0 100,100 A 50,50 0 0,1 100,0" fill="white" />

                {/* <!-- 上方黑色小圆 --> */}
                <circle cx="100" cy="50" r="12.5" fill="hsl(var(--primary))" />

                {/* <!-- 下方白色小圆 --> */}
                <circle cx="100" cy="150" r="12.5" fill="white" />
            </svg>
        </div>
    )
}
