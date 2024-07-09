"use client"

import { Button } from '@/components/ui/button';
import { 
  useOrganization,
  useUser
} from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  DialogHeader, 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(1).max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, `Required`)
})


export function UploadButton() {
  const { toast } = useToast()
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orgId) return;

    const postUrl = await generateUploadUrl()
    const result = await fetch(postUrl, {
      method: "POST", 
      headers: { "Content-Type" : values.file[0].type}, 
      body: values.file[0]
    })

    const { storageId } = await result.json() 

    try{
      await createFile({
        name: values.title,
        fileId: storageId,
        orgId
      });
      form.reset()
      setIsFileDialog(false)
      toast({
        variant: "success",
        title: "File Uploaded", 
        description: "Now Everyone Can View Your File"
      })
    }
    catch(err) {
      toast({
        variant: "destructive",
        title: "Something Went Wrong", 
        description: "Your File Could Not Be Uploaded, Try Again Later"
      })
    }
  }
  
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id && user.user?.id;
  }

  const [isFileDialogOpen, setIsFileDialog] = useState(false)
  const createFile = useMutation(api.files.createFile);

  return (
    <Dialog open={isFileDialogOpen} onOpenChange={(isOpen) => { 
        setIsFileDialog(isOpen) 
        form.reset();
        }}>
        <DialogTrigger asChild>
        <Button 
            onClick={() => {}}
        >
            Upload File
        </Button>
        Open
        </DialogTrigger>
        <DialogContent>
        <DialogHeader>
            <DialogTitle className='mb-8'>Upload Your File Here</DialogTitle>
            <DialogDescription>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                        <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange }, ...field }) => (
                    <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                        <Input
                        type="file" {...field}
                        onChange={(event) => {
                            if (!event.target.files) return;
                            onChange(event.target.files[0])
                        }}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button 
                type="submit"
                disabled={form.formState.isSubmitting} 
                className='flex gap-1'
                >
                {form.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 animated-spin" />
                )}
                Submit
                </Button>
            </form>
            </Form>
            </DialogDescription>
        </DialogHeader>
        </DialogContent>
    </Dialog>
  );
}
