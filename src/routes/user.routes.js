const router = require('express').Router();
const controller = require('../controllers/user.controller');
const { uploadSingle } = require('../middlewares/upload');
const { UPLOAD_KINDS } = require('../constants');

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear un usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/UserOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios (paginado)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200: { $ref: '#/components/responses/UserList' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 * /api/users/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener un usuario por id
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200: { $ref: '#/components/responses/UserOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Usuarios]
 *     summary: Actualizar un usuario
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/UserOk' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar un usuario (falla si tiene envíos asociados)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       204: { description: Usuario eliminado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 * /api/users/{id}/documents:
 *   post:
 *     tags: [Usuarios]
 *     summary: Cargar un documento del usuario (PDF, JPG o PNG)
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [document]
 *             properties:
 *               document: { type: string, format: binary }
 *     responses:
 *       201: { $ref: '#/components/responses/FileOk' }
 *       400:
 *         description: Archivo requerido (FILE_REQUIRED) o identificador/campo inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       413: { $ref: '#/components/responses/PayloadTooLarge' }
 *       415: { $ref: '#/components/responses/UnsupportedMediaType' }
 */
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/documents', uploadSingle('document', UPLOAD_KINDS.DOCUMENT), controller.uploadDocument);

module.exports = router;
