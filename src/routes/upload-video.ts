import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart"; //trabalhar com arquivos
import path from "node:path";
import { randomUUID } from "node:crypto"; //gerador de id único
import  fs  from "node:fs";
import  { pipeline }  from "node:stream"; //aguardar que o upload finalize
import { promisify } from "node:util";  //transformar uma função antiga do node para usar o async
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance){
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25//tamanho do arquivo(1mega *25 = 25mega)
    }
  })

  app.post('/videos', async (req, rep) => {
    const data = await req.file()

    if(!data){
      return rep.status(400).send({error: 'Missing file input.'})
    }

    const extension = path.extname(data.filename) //pegando a extension do arquivo

    if(extension !== '.mp3'){
      return rep.status(400).send({error: 'Invalid input type, please upload a MP3.'})
    }

     //retornar o nome do arquivo sem a extension e a passa como parameter 
    const fileBaseName = path.basename(data.filename, extension)

    const fileUploadName = `${fileBaseName}-${randomUUID()}+${extension}` //gerando o nome do arquivo

    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName) //caminho do arquivo

    //recebe os dados e depois o escreve conforme o arquivo vai chegando(upload)
    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video = await prisma.video.create({
      data:{
        name: data.filename,
        path: uploadDestination
      }
    }) //saving the data in the bank

    return {video}
  })
}