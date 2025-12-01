'use client'

import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { ArrowLeft, FileAudio } from 'lucide-react'
import Upload from '@/components/Upload'
import StatusTracker from '@/components/StatusTracker'
import { Job, Speaker } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])

  // Load recent jobs on mount
  useEffect(() => {
    loadRecentJobs()
  }, [])

  async function loadRecentJobs() {
    if (!supabase) return

    try {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setRecentJobs(data)
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error)
    }
  }

  const handleUpload = async (
    file: File,
    options: {
      programName: string
      teachTxt?: File
      teachAudio?: File
      speakers: Speaker[]
    }
  ) => {
    setUploading(true)

    try {
      // Get user session (if exists)
      let session = null
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        session = data
      }

      // Create form data for API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('program_name', options.programName)

      if (options.teachTxt) {
        formData.append('teach_txt_file', options.teachTxt)
      }

      if (options.teachAudio) {
        formData.append('teach_audio_file', options.teachAudio)
      }

      if (options.speakers.length > 0) {
        formData.append('speakers_json', JSON.stringify(options.speakers))
      }

      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://alizzlolp11-srt-generation-api.hf.space'

      // Upload to FastAPI backend
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: session?.session
          ? { Authorization: `Bearer ${session.session.access_token || ''}` }
          : {}
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Upload failed')
      }

      const result = await response.json()

      // Update job with user ID if logged in
      if (session?.session?.user && supabase) {
        await supabase
          .from('jobs')
          .update({ user_id: session.session.user.id })
          .eq('id', result.job_id)
      }

      setCurrentJobId(result.job_id)
      setCurrentJob(null)

      // Reload recent jobs
      loadRecentJobs()

      // Show success message
      const { toast } = await import('react-hot-toast')
      toast.success(
        `ไฟล์ถูกส่งเรียบร้อย! คาดว่าใช้เวลาประมวลผล ${result.estimated_time} นาที`
      )
    } catch (error) {
      console.error('Upload error:', error)
      const { toast } = await import('react-hot-toast')
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด')
    } finally {
      setUploading(false)
    }
  }

  const handleJobComplete = (job: Job) => {
    setCurrentJob(job)
    loadRecentJobs()
  }

  const handleBack = () => {
    setCurrentJobId(null)
    setCurrentJob(null)
    loadRecentJobs()
  }

  // If showing job status
  if (currentJobId && !currentJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto py-8">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับหน้าหลัก
          </button>

          <StatusTracker jobId={currentJobId} onComplete={handleJobComplete} />
        </div>

        <Toaster position="top-right" />
      </div>
    )
  }

  // If job completed
  if (currentJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto p-6">
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              สร้างคำบรรยายเพิ่มเติม
            </button>

            <StatusTracker jobId={currentJob.id} />
          </div>
        </div>

        <Toaster position="top-right" />
      </div>
    )
  }

  // Main upload page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileAudio className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">SRT Generator</h1>
          </div>
          <p className="text-lg text-gray-600">
            แปลงไฟล์เสียงและวิดีโอเป็นคำบรรยาย SRT ด้วย AI
          </p>
          <p className="text-sm text-gray-500 mt-2">
            รองรับไฟล์ MP3, WAV, M4A, MP4, MOV และอื่นๆ (สูงสุด 200MB)
          </p>
        </div>

        {/* Upload Component */}
        <Upload
          onUpload={handleUpload}
          uploading={uploading}
          speakers={speakers}
        />

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">งานล่าสุด</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setCurrentJobId(job.id)}
                  className="p-6 border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {job.program_name || job.filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {job.status === 'processing_audio' && 'กำลังถอดเสียง'}
                        {job.status === 'processing' && 'กำลังประมวลผล'}
                        {job.status === 'completed' && 'เสร็จสิ้น'}
                        {job.status === 'error' && 'เกิดข้อผิดพลาด'}
                      </span>
                      <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  )
}