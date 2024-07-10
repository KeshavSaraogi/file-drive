"use client"

import { 
  useOrganization,
  useUser
} from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState } from 'react';
import { UploadButton } from './upload-file';
import { FileCard } from './file-card';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const organization = useOrganization();
  const user = useUser();
  
  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id && user.user?.id;
  }

  const [isFileDialogOpen, setIsFileDialog] = useState(false)
  const files = useQuery(api.files.getFiles, orgId ? { orgId } : "skip");
  const isLoading = files === undefined;

  return (
    <main className="container mx-auto pt-12">
      {isLoading && (
        <div className='flex flex-col gap-8  w-full items-center mt-24'>
          <Loader2 className="h-24 w-24 animated-spin text-gray-500"/>
          <div className='text-2xl'>Loading Your Images...</div>
        </div>
      )}
      {!isLoading && files.length === 0 && (
          <div className="flex flex-col gap-8  w-full items-center mt-24">
            <Image 
              alt="an image of a picture and directory icon"
              width="200"
              height="200"
              src="/empty.svg"
            />
            <div className="text-2xl">You Have No Files, Upload One Now</div>
            <UploadButton />
        </div>
      )}

      {!isLoading && files.length > 0 && (
        <>
          <div className='flex justify-between items-center mb-8'>
            <h1 className="text-4xl font-bold">Your Files</h1>
            <UploadButton />
          </div>
          <div className='grid grid-cols-4 gap-4'>
            {files?.map(file => (
            <FileCard key={file._id} file={file} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
