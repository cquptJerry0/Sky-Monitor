import { Separator } from '@/components/ui/separator'

export function Footer() {
    return (
        <footer className="mt-auto border-t bg-muted/40">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">关于我们</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    公司介绍
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    联系我们
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    招聘信息
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">客户服务</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    帮助中心
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    退换货政策
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    配送说明
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">购物指南</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    如何下单
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    支付方式
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    发票说明
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">关注我们</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    微信公众号
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    新浪微博
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-foreground">
                                    官方博客
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="text-center text-sm text-muted-foreground">
                    <p>© 2024 Sky Shop. All rights reserved. | Powered by Sky Monitor</p>
                </div>
            </div>
        </footer>
    )
}
