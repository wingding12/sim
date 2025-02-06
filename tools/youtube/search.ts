import { ToolConfig, ToolResponse } from '../types'

export interface YouTubeSearchParams {
  apiKey: string
  query: string
  maxResults?: number
  pageToken?: string
}

export interface YouTubeSearchResponse extends ToolResponse {
  output: {
    items: Array<{
      videoId: string
      title: string
      description: string
      thumbnail: string
    }>
    totalResults: number
    nextPageToken?: string
  }
}

export const youtubeSearchTool: ToolConfig<YouTubeSearchParams, YouTubeSearchResponse> = {
  id: 'youtube_search',
  name: 'YouTube Search',
  description: 'Search for videos on YouTube using the YouTube Data API.',
  version: '1.0.0',
  params: {
    query: {
      type: 'string',
      required: true,
      description: 'Search query for YouTube videos',
    },
    apiKey: {
      type: 'string',
      required: true,
      requiredForToolCall: true,
      description: 'YouTube API Key',
    },
    maxResults: {
      type: 'number',
      required: false,
      default: 5,
      description: 'Maximum number of videos to return',
    },
  },
  request: {
    url: (params: YouTubeSearchParams) => {
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&key=${params.apiKey}&q=${encodeURIComponent(
        params.query
      )}`
      url += `&maxResults=${params.maxResults || 5}`
      return url
    },
    method: 'GET',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
  },
  transformResponse: async (response: Response): Promise<YouTubeSearchResponse> => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API error')
    }
    const items = (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail:
        item.snippet?.thumbnails?.default?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.high?.url ||
        '',
    }))
    return {
      success: true,
      output: {
        items,
        totalResults: data.pageInfo?.totalResults || 0,
        nextPageToken: data.nextPageToken,
      },
    }
  },
  transformError: (error: any): string => {
    const message = error.error?.message || error.message || 'YouTube search failed'
    const code = error.error?.code || error.code
    return `${message} (${code})`
  },
}
