'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, FileAudio, FileVideo, Settings, X, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Speaker } from '@/lib/supabase'

interface UploadProps {
  onUpload: (file: File, options: UploadOptions) => Promise<void>
  uploading: boolean
  speakers?: Speaker[]
}

interface UploadOptions {
  programName: string
  teachTxt?: File
  teachAudio?: File
  speakers: Speaker[]
}

export default function Upload({ onUpload, uploading, speakers = [] }: UploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [programName, setProgramName] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [newSpeaker, setNewSpeaker] = useState({ id: '', name: '', comment: '' })
  const [teachTxtFile, setTeachTxtFile] = useState<File | null>(null)
  const [teachAudioFile, setTeachAudioFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]

    // Check file size (200MB)
    if (uploadedFile.size > 200 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกิน 200MB')
      return
    }

    setFile(uploadedFile)

    // Extract program name from filename if not set
    if (!programName) {
      const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, '')
      setProgramName(nameWithoutExt)
    }
  }, [programName])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.flac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    multiple: false,
    disabled: uploading
  })

  // Teaching text file dropzone
  const onTeachTxtDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]

    // Check file type
    const validExtensions = ['.txt', '.srt']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      toast.error('กรุณาเลือกไฟล์ .txt หรือ .srt เท่านั้น')
      return
    }

    setTeachTxtFile(file)
  }, [])

  const {
    getRootProps: getTeachTxtRootProps,
    getInputProps: getTeachTxtInputProps,
    isDragActive: isTeachTxtDragActive
  } = useDropzone({
    onDrop: onTeachTxtDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/x-subrip': ['.srt']
    },
    multiple: false,
    disabled: uploading
  })

  // Teaching audio file dropzone
  const onTeachAudioDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]

    // Check file type
    if (!file.type.startsWith('audio/')) {
      toast.error('กรุณาเลือกไฟล์เสียงเท่านั้น')
      return
    }

    setTeachAudioFile(file)
  }, [])

  const {
    getRootProps: getTeachAudioRootProps,
    getInputProps: getTeachAudioInputProps,
    isDragActive: isTeachAudioDragActive
  } = useDropzone({
    onDrop: onTeachAudioDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.flac']
    },
    multiple: false,
    disabled: uploading
  })

  const handleUpload = async () => {
    if (!file) {
      toast.error('กรุณาเลือกไฟล์')
      return
    }

    if (!programName.trim()) {
      toast.error('กรุณาใส่ชื่อรายการ')
      return
    }

    // Merge speakers from props with local state
    const allSpeakers = [...speakers, ...speakers]

    await onUpload(file, {
      programName: programName.trim(),
      teachTxt: teachTxtFile || undefined,
      teachAudio: teachAudioFile || undefined,
      speakers: allSpeakers.filter(s => s.id && s.name)
    })
  }

  const addSpeaker = () => {
    if (!newSpeaker.id || !newSpeaker.name) {
      toast.error('กรุณาใส่ ID และชื่อผู้พูด')
      return
    }

    setSpeakers([...speakers, { ...newSpeaker }])
    setNewSpeaker({ id: '', name: '', comment: '' })
  }

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index))
  }

  const removeTeachTxtFile = () => {
    setTeachTxtFile(null)
  }

  const removeTeachAudioFile = () => {
    setTeachAudioFile(null)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">สร้างคำบรรยาย SRT ด้วย AI</h1>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="space-y-4">
              {file.type.startsWith('audio/') ? (
                <FileAudio className="w-16 h-16 mx-auto text-blue-500" />
              ) : (
                <FileVideo className="w-16 h-16 mx-auto text-blue-500" />
              )}
              <div>
                <p className="font-semibold text-gray-800">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <UploadIcon className="w-16 h-16 mx-auto text-gray-400" />
              <div>
                <p className="text-xl font-semibold text-gray-700">
                  {isDragActive ? 'วางไฟล์ที่นี่...' : 'ลากไฟล์มาวางที่นี่'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  หรือคลิกเพื่อเลือกไฟล์ (สูงสุด 200MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Program Name */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อรายการ
          </label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="ใส่ชื่อรายการของคุณ"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={uploading}
          />
        </div>

        {/* Advanced Options */}
        <div className="mt-6">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={uploading}
          >
            <Settings className="w-5 h-5" />
            ตั้งค่าขั้นสูง (Teach AI)
          </button>
        </div>

        {showOptions && (
          <div className="mt-6 space-y-6 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">Teach AI - สอน AI ให้เรียนรู้สไตล์ของคุณ</h3>

            {/* Teaching Text File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ไฟล์คำบรรยายตัวอย่าง (.txt หรือ .srt)
              </label>
              <div
                {...getTeachTxtRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isTeachTxtDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getTeachTxtInputProps()} />
                {teachTxtFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileAudio className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{teachTxtFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(teachTxtFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTeachTxtFile()
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      {isTeachTxtDragActive ? 'วางไฟล์ที่นี่...' : 'ลากไฟล์ .txt หรือ .srt มาวางที่นี่'}
                    </p>
                    <p className="text-xs text-gray-500">
                      หรือคลิกเพื่อเลือกไฟล์
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Teaching Audio File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ไฟล์เสียงตัวอย่าง (ต้องตรงกับไฟล์คำบรรยายข้างบน)
              </label>
              <div
                {...getTeachAudioRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  isTeachAudioDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getTeachAudioInputProps()} />
                {teachAudioFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileAudio className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{teachAudioFile.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(teachAudioFile.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTeachAudioFile()
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      {isTeachAudioDragActive ? 'วางไฟล์ที่นี่...' : 'ลากไฟล์เสียงมาวางที่นี่'}
                    </p>
                    <p className="text-xs text-gray-500">
                      หรือคลิกเพื่อเลือกไฟล์เสียง
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Speakers Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อมูลผู้พูด (ID:ชื่อ:ลักษณะ)
              </label>

              {speakers.map((speaker, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={`${speaker.id}: ${speaker.name} (${speaker.comment})`}
                    disabled
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => removeSpeaker(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    disabled={uploading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID"
                  value={newSpeaker.id}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, id: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <input
                  type="text"
                  placeholder="ชื่อผู้พูด"
                  value={newSpeaker.name}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <input
                  type="text"
                  placeholder="ลักษณะ (เช่น พิธีกร)"
                  value={newSpeaker.comment}
                  onChange={(e) => setNewSpeaker({ ...newSpeaker, comment: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <button
                  onClick={addSpeaker}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  disabled={uploading}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || !programName.trim() || uploading}
          className="mt-8 w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              กำลังประมวลผล...
            </div>
          ) : (
            'เริ่มสร้างคำบรรยาย'
          )}
        </button>
      </div>
    </div>
  )
}