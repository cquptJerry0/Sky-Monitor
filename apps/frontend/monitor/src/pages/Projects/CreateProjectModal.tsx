import { PlusCircle } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateApplicationPayload } from '@/types/api'

import { appsOptions } from './meta'

export interface CreateProjectsModalProps {
    onCreateProject: (values: CreateApplicationPayload) => void
}

export function CreateProjectsModal(props: CreateProjectsModalProps) {
    const form = useForm<CreateApplicationPayload>()
    const [open, setOpen] = React.useState(false)

    const handleCreateProject = (values: CreateApplicationPayload) => {
        props.onCreateProject(values)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogOverlay className="backdrop-blur-sm bg-transparent" />
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    创建应用
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>创建监控应用</DialogTitle>
                    <DialogDescription>请选择项目类型、填写应用名，以创建一个新的监控项目。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className="grid items-start gap-4" onSubmit={form.handleSubmit(handleCreateProject)}>
                        <FormField
                            control={form.control}
                            rules={{ required: '请选择应用类型' }}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>应用类型</FormLabel>
                                    <FormControl>
                                        <Select {...field} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="请选择创建的应用类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {appsOptions.map(({ value, label, icon }) => (
                                                        <SelectItem value={value}>
                                                            <div className="flex flex-row items-center">
                                                                <img src={icon} alt="Vanilla" className="w-6 h-6 mr-2 rounded-sm" />
                                                                <span>{label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            rules={{ required: '请输入应用名称' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>应用名称</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">创建</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
