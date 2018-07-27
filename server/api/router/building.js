import express from 'express'
import building from '../../controller/building'

const Router = express.Router()

Router
    .get('/list', async(req, res) => { // 查询楼盘列表、推荐楼盘列表
        /**
            入参：
            {   token:'',
                recommend:true,
                search:'',
                city:'',
                district:'',
                time:'',
                houseType:'',
                page:1,
                pageCount:10
            }
            返回：
            [

            ]
        */
        const result = await building.list(req, res)
        res.json(result)
    })
    .get('/banner', async(req, res) => { // 查询banner
        /**
            入参：
            {
                district:''
            }
            返回：
            [

            ]
        */
        const result = await building.banner(req, res)
        res.json(result)
    })
    .get('/', async(req, res) => { // 查询楼盘详情
        /**
            入参：
            {
                id:''
            }
            返回：
            [

            ]
        */
        const result = await building.get(req, res)
        res.json(result)
    })
    .post('/', async(req, res) => { // 发布楼盘
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
        const result = await building.create(req, res)
        res.json(result)
    })
    .delete('/', async(req, res) => { // 删除楼盘
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
        const result = await building.delete(req, res)
        res.json(result)
    })
    .put('/', async(req, res) => { // 编辑楼盘
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
        const result = await building.update(req, res)
        res.json(result)
    })

export default Router