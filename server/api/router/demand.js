import express from 'express'
import demand from '../../controller/demand'

const Router = express.Router()

Router
    .get('/list', async(req, res) => { // 查询需求列表
        /**
            入参：
            {
                token:''
            }
            返回：
            [

            ]
        */
        const result = await demand.list(req, res)
        res.json(result)
    })
    .get('/', async(req, res) => { // 查询需求详情
        /**
            入参：
            {
                token:''
            }
            返回：
            [

            ]
        */
        const result = await demand.get(req, res)
        res.json(result)
    })
    .post('/', async(req, res) => { // 发布新客户需求
        /**
            入参：
            {
                token:'',
                else
            }
            返回：
            [

            ]
        */
        const result = await demand.create(req, res)
        res.json(result)
    })
    .delete('/', async(req, res) => { // 删除客户需求
        /**
            入参：
            {
                token:'',
                else
            }
            返回：
            [

            ]
        */
        const result = await demand.delete(req, res)
        res.json(result)
    })
    .put('/', async(req, res) => { // 修改客户需求
        /**
            入参：
            {
                token:'',
                else
            }
            返回：
            [

            ]
        */
        const result = await demand.update(req, res)
        res.json(result)
    })

export default Router