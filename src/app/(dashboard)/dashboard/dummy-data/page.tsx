'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database, Play, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface DummyDataTemplate {
  id: string
  name: string
  description: string
  category: string
  templates: {
    title: string
    content: string
    maxContributions: number
  }[]
}

const dummyDataTemplates: DummyDataTemplate[] = [
  {
    id: 'poetry',
    name: '시 (Poetry)',
    description: '다양한 주제의 시 작품들',
    category: '시',
    templates: [
      {
        title: '봄날의 기억',
        content: '벚꽃이 흩날리는 오후\n그대와 걷던 그 길에서\n바람은 살며시 속삭이고',
        maxContributions: 3
      },
      {
        title: '도시의 밤',
        content: '네온사인이 깜빡이는\n이 도시의 깊은 밤\n혼자 걷는 발걸음이',
        maxContributions: 4
      },
      {
        title: '바다로 가는 길',
        content: '끝없는 수평선 너머\n파도가 부르는 노래\n마음이 달려가네',
        maxContributions: 2
      }
    ]
  },
  {
    id: 'novel',
    name: '소설 (Novel)',
    description: '단편소설과 연재소설의 시작',
    category: '소설',
    templates: [
      {
        title: '마지막 편의점',
        content: '새벽 3시, 도시 한복판의 작은 편의점. 야간 알바생 준호는 오늘도 밤을 지키고 있었다. 그때, 문이 열리며 이상한 손님이 들어왔다.',
        maxContributions: 4
      },
      {
        title: '시간여행자의 딜레마',
        content: '2024년에서 1990년으로 떨어진 물리학자 이민준. 그는 미래를 바꿀 수 있는 기회를 얻었지만, 그 대가가 무엇인지 아직 몰랐다.',
        maxContributions: 3
      },
      {
        title: '로봇과 인간 사이',
        content: 'AI 로봇 ARIA는 인간의 감정을 학습하기 시작했다. 하지만 감정을 가진 로봇에게 주어진 임무는 너무나 잔혹했다.',
        maxContributions: 4
      }
    ]
  },
  {
    id: 'essay',
    name: '에세이 (Essay)',
    description: '일상의 소중한 이야기들',
    category: '에세이',
    templates: [
      {
        title: '카페에서 만난 사람들',
        content: '매일 아침 들르는 동네 카페. 단골이 된 지 1년, 이제는 바리스타와 다른 손님들의 이야기도 조금씩 알게 되었다.',
        maxContributions: 2
      },
      {
        title: '아버지의 텃밭',
        content: '은퇴 후 텃밭을 가꾸기 시작한 아버지. 처음엔 걱정했지만, 아버지의 얼굴이 점점 밝아지는 것을 보며 깨달은 것이 있다.',
        maxContributions: 3
      },
      {
        title: '혼자 떠난 여행',
        content: '처음으로 혼자 떠난 제주도 여행. 누구의 눈치도 보지 않고, 내가 원하는 대로 보고, 먹고, 쉬었던 3일간의 기록.',
        maxContributions: 2
      }
    ]
  },
  {
    id: 'scenario',
    name: '시나리오 (Scenario)',
    description: '영화나 드라마의 시작',
    category: '시나리오',
    templates: [
      {
        title: '마지막 수업',
        content: 'FADE IN:\n\nEXT. 고등학교 - 오후\n\n졸업식 다음날, 텅 빈 교실. 담임선생님 김정훈(50대)이 혼자 책상을 정리하고 있다.',
        maxContributions: 4
      },
      {
        title: '택시 기사의 하루',
        content: 'INT. 택시 안 - 새벽\n\n베테랑 택시기사 박현수(60대)가 라디오를 듣며 운전하고 있다. 갑자기 급한 손님이 탄다.',
        maxContributions: 3
      }
    ]
  }
]

const dummyAuthors = [
  '별빛작가', '바람글쟁이', '도시탐험가', '달빛시인', '구름여행자', 
  '숲속작가', '바다이야기', '산골문인', '햇살작가', '노을여행자',
  '책벌레작가', '커피문학가', '라떼작가', '음악작가', '영화작가'
]

export default function DummyDataGeneratorPage() {
  const [loading, setLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [numWorks, setNumWorks] = useState(10)
  const [generateContributions, setGenerateContributions] = useState(true)
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null)

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectAllCategories = () => {
    setSelectedCategories(dummyDataTemplates.map(template => template.id))
  }

  const clearAllCategories = () => {
    setSelectedCategories([])
  }

  const generateRandomAuthor = () => {
    return dummyAuthors[Math.floor(Math.random() * dummyAuthors.length)]
  }

  const generateDummyData = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category')
      return
    }

    setLoading(true)
    setResults(null)
    
    const errors: string[] = []
    let successCount = 0

    try {
      // Create a temporary admin user if needed
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        errors.push('No authenticated user found')
        setResults({ success: successCount, errors })
        setLoading(false)
        return
      }

      const selectedTemplates = dummyDataTemplates.filter(template => 
        selectedCategories.includes(template.id)
      )

      for (let i = 0; i < numWorks; i++) {
        try {
          // Pick random template from selected categories
          const randomTemplate = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)]
          const randomWork = randomTemplate.templates[Math.floor(Math.random() * randomTemplate.templates.length)]
          
          const author = generateRandomAuthor()
          
          // Create work
          const { data: work, error: workError } = await supabase
            .from('works')
            .insert({
              title: `${randomWork.title} ${i + 1}`,
              content: randomWork.content,
              author,
              author_id: user.id, // Use current admin user as author
              category: randomTemplate.category,
              completion_rate: Math.random() * 0.3 + 0.3, // Random between 0.3 and 0.6
              contributors_count: 0,
              view_count: Math.floor(Math.random() * 100),
              like_count: Math.floor(Math.random() * 20),
              is_private: Math.random() < 0.2, // 20% chance of being private
              max_contributions: randomWork.maxContributions
            } as any)
            .select()
            .single()

          if (workError) {
            errors.push(`Failed to create work ${i + 1}: ${workError.message}`)
            continue
          }

          // Generate contributions if enabled
          if (generateContributions && work) {
            const numContributions = Math.floor(Math.random() * (randomWork.maxContributions - 1)) + 1
            
            for (let j = 0; j < numContributions; j++) {
              try {
                const contributionTexts = [
                  '이어서 써보겠습니다!\n새로운 전개가 기대되네요.',
                  '좋은 시작이군요.\n다음은 어떻게 될까요?',
                  '감동적인 내용입니다.\n계속 이어가고 싶어요.',
                  '흥미진진한 전개입니다!\n더 많은 이야기가 궁금해요.',
                  '아름다운 표현이네요.\n함께 완성해봐요.'
                ]

                await supabase
                  .from('contributions')
                  .insert({
                    work_id: (work as any)?.id,
                    author: generateRandomAuthor(),
                    author_id: user.id,
                    content: contributionTexts[Math.floor(Math.random() * contributionTexts.length)],
                    like_count: Math.floor(Math.random() * 5)
                  } as any)

                // Update work contributors count
                const updateData = { 
                  contributors_count: j + 1,
                  completion_rate: Math.min(1, (j + 1) / randomWork.maxContributions + 0.3)
                }
                await (supabase as any)
                  .from('works')
                  .update(updateData)
                  .eq('id', (work as any)?.id)
              } catch (error) {
                console.error('Error creating contribution:', error)
              }
            }
          }

          successCount++
        } catch (error: any) {
          errors.push(`Failed to create work ${i + 1}: ${error.message}`)
        }
      }
    } catch (error: any) {
      errors.push(`General error: ${error.message}`)
    } finally {
      setResults({ success: successCount, errors })
      setLoading(false)
    }
  }

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to delete ALL works and contributions? This action cannot be undone!')) {
      return
    }

    setLoading(true)
    const errors: string[] = []

    try {
      // Delete all contributions first
      const { error: contributionsError } = await (supabase as any)
        .from('contributions')
        .delete()
        .neq('id', '')

      if (contributionsError) {
        errors.push(`Error deleting contributions: ${contributionsError.message}`)
      }

      // Delete all works
      const { error: worksError } = await (supabase as any)
        .from('works')
        .delete()
        .neq('id', '')

      if (worksError) {
        errors.push(`Error deleting works: ${worksError.message}`)
      }

      // Delete all likes and bookmarks
      await (supabase as any).from('likes').delete().neq('id', '')
      await (supabase as any).from('bookmarks').delete().neq('id', '')
      await (supabase as any).from('notifications').delete().neq('id', '')

      if (errors.length === 0) {
        setResults({ success: 0, errors: ['All data cleared successfully'] })
      } else {
        setResults({ success: 0, errors })
      }
    } catch (error: any) {
      setResults({ success: 0, errors: [`Error clearing data: ${error.message}`] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dummy Data Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate sample works and contributions for testing and development
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
          
          {/* Number of Works */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Works to Generate
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={numWorks}
              onChange={(e) => setNumWorks(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Generate Contributions */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generateContributions}
                onChange={(e) => setGenerateContributions(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Generate random contributions for each work
              </span>
            </label>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Categories to Generate
              </label>
              <div className="space-x-2">
                <button
                  onClick={selectAllCategories}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Select All
                </button>
                <button
                  onClick={clearAllCategories}
                  className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {dummyDataTemplates.map((template) => (
                <label key={template.id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(template.id)}
                    onChange={() => handleCategoryToggle(template.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.description} • {template.templates.length} templates
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={generateDummyData}
              disabled={loading || selectedCategories.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Generate Dummy Data</span>
                </>
              )}
            </button>

            <button
              onClick={clearAllData}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
          
          {!results && !loading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Configure and generate dummy data to see results here</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Generating dummy data...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              {results.success > 0 && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Successfully generated {results.success} works</span>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>Errors ({results.errors.length})</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700 dark:text-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Templates Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dummyDataTemplates.map((template) => (
            <div 
              key={template.id} 
              className={`border rounded-lg p-4 transition-colors ${
                selectedCategories.includes(template.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {template.description}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {template.templates.length} templates available
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}