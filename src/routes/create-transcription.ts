import { FastifyInstance } from "fastify";
import { createReadStream } from 'node:fs' // ler ou escrever algo aos poucos
import { z } from 'zod'; //trabalhar com validações
import { prisma } from "../lib/prisma";
import { openai } from "../lib/openai"

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async (req) => {

    //o vídeo pode ou não existir e para isso é feito uma validação para verificar ser existe

    //esquema de validação 
    const paramsSchema = z.object({
      videoId: z.string().uuid(), // espera-se que o valor desse campo seja uma string que representa um UUID 
    })

    //validar o objeto e ser for correspondido a validação, retornar o valor videoId(string)
    const { videoId } = paramsSchema.parse(req.params)

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const { prompt } = bodySchema.parse(req.body)

    //transcrição do video

    //pegando o arquivo de áudio do video
    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      }
    })

    //pegar caminho onde o vídeo foi salvo
    const videoPath = video.path

    //fluxo de leitura do video
    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    const transcription = response.text

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription
      }
    })

    return { transcription }
  })
}