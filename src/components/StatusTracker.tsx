'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle, Download, Loader2, FileText } from 'lucide-react'
import { Job } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface StatusTrackerProps {
  jobId: string
  onComplete?: (job: Job) => void
}

interface StatusStep {
  status: 'uploading' | 'processing' | 'processing_audio' | 'completed' | 'error'
  label: string
  description: string
}

const statusSteps: StatusStep[] = [
  {
    status: 'uploading',
    label: 'อัปโหลดไฟล์',
    description: 'กำลังส่งไฟล์ไปยังเซิร์ฟเวอร์'
  },
  {
    status: 'processing',
    label: 'กำลังเตรียม',
    description: 'เตรียมประมวลผลไฟล์เสียง'
  },
  {
    status: 'processing_audio',
    label: 'ถอดเสียง',
    description: 'AI กำลังถอดเสียงเป็นข้อความ'
  },
  {
    status: 'completed',
    label: 'เสร็จสิ้น',
    description: 'คำบรรยายพร้อมดาวน์โหลด'
  },
  {
    status: 'error',
    label: 'เกิดข้อผิดพลาด',
    description: 'กรุณาลองใหม่อีกครั้ง'
  }
]

export default function StatusTracker({ jobId, onComplete }: StatusTrackerProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    fetchJobStatus()

    // Subscribe to real-time updates
    let subscription = null
    if (supabase) {
      subscription = supabase
        .channel(`job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${jobId}`
          },
          (payload) => {
            setJob(payload.new as Job)
            if (payload.new.status === 'completed' && onComplete) {
              onComplete(payload.new as Job)
            }
          }
        )
        .subscribe()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [jobId, onComplete])

  async function fetchJobStatus() {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error
      setJob(data)
    } catch (error) {
      console.error('Error fetching job status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status?: string) => {
    if (!status) return -1
    return statusSteps.findIndex(step => step.status === status)
  }

  const getStepIcon = (stepStatus: string, currentStatus?: string) => {
    const currentIndex = getStatusIndex(currentStatus)
    const stepIndex = getStatusIndex(stepStatus)

    if (currentStatus === 'error') {
      return <XCircle className="w-6 h-6 text-red-500" />
    }

    if (currentIndex > stepIndex || (currentStatus === 'completed' && stepStatus === 'completed')) {
      return <CheckCircle className="w-6 h-6 text-green-500" />
    }

    if (currentIndex === stepIndex && currentStatus !== 'completed') {
      return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    }

    return <Clock className="w-6 h-6 text-gray-300" />
  }

  const formatDuration = () => {
    if (!job?.created_at) return ''

    const start = new Date(job.created_at)
    const end = job.completed_at ? new Date(job.completed_at) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)

    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i - 1]
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12 text-gray-500">
            ไม่พบข้อมูลการทำงาน
          </div>
        </div>
      </div>
    )
  }

  const currentIndex = getStatusIndex(job.status)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">สถานะการประมวลผล</h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>ไฟล์: {job.filename}</span>
            <span>ขนาด: {formatFileSize(job.file_size)}</span>
            {job.status !== 'processing' && job.status !== 'processing_audio' && (
              <span>ใช้เวลา: {formatDuration()}</span>
            )}
          </div>
        </div>

        {/* Status Steps */}
        <div className="space-y-6">
          {statusSteps.slice(0, job.status === 'error' ? 4 : -1).map((step) => (
            <div key={step.status} className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-1">
                {getStepIcon(step.status, job.status)}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  currentIndex >= getStatusIndex(step.status) || job.status === 'error'
                    ? 'text-gray-800'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </h3>
                <p className={`text-sm ${
                  currentIndex >= getStatusIndex(step.status) || job.status === 'error'
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {job.status === 'error' && job.error_message && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{job.error_message}</p>
          </div>
        )}

        {/* Download Section */}
        {job.status === 'completed' && job.srt_url && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-4">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">คำบรรยายพร้อมแล้ว!</h3>
                <p className="text-sm text-green-600 mt-1">ดาวน์โหลดไฟล์ SRT ได้ทันที</p>
              </div>
              <a
                href={job.srt_url}
                download={`${job.program_name || job.filename}.srt`}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                ดาวน์โหลด SRT
              </a>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {job.program_name && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              รายการ: <span className="font-medium">{job.program_name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}