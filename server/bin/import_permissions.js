const p = require('../permissions');
const db = require('../common/mysql/db');

const {select,insert,update,or,and,not,eq,like,$in,lt,gt,lte,gte,between}=require('sql-bricks');

// console.log(p.permissions.role)

add_role = function() {
    // step1 插入角色
    var sql = select().from('role') //^拼装sql
    sql = sql.toParams({placeholder: '?'}) //$拼装sql
    const promise = db.query(sql.text, sql.values).catch((err) => {
        console.log('查询角色错误：' + err)
        process.exit()
    })
    promise.then(function(result){
        
        var role_exist = []
        for(var i in result){
            role_exist.push(result[i].name)
        }
        var insert_rolevalues = []
        for(var i in p.permissions.role){
            if(role_exist.indexOf(p.permissions.role[i].name) == -1){
                insert_rolevalues.push({name: p.permissions.role[i].name})
            }
        }
        //var sql = insert('role').values(insert_rolevalues)
        if(insert_rolevalues.length > 0){
            var sql = insert('role').values(insert_rolevalues).toParams({placeholder: '?'})
            const promise = db.query(sql.text, sql.values).catch((err) => {
                console.log('插入角色错误：' + err)
                process.exit()
            })
            promise.then(function(result){
                console.log(result)
                console.log('插入角色成功，总数：' + result.affectedRows)
            })
        }

    })

    return promise
}

add_policy = function() {
    // step2 插入策略
    var sql = select().from('menu') //^拼装sql
    sql = sql.toParams({placeholder: '?'}) //$拼装sql
    const promise = db.query(sql.text, sql.values).catch((err) => {
        console.log('查询策略错误：' + err)
        process.exit()
    })

    promise.then(function(result){

        var policy_exist = []
        for(var i in result){
            policy_exist.push(result[i].name)
        }

        var insert_rolevalues = []
        for(var i in p.permissions.policies){
            if(p.permissions.policies[i].name != '' && policy_exist.indexOf(p.permissions.policies[i].name) == -1){
                insert_rolevalues.push({
                    name: p.permissions.policies[i].name,
                    policy: p.permissions.policies[i].policy,
                    ispublic: 0
                })
            }
        }

        for(var i in p.permissions.policiesPublic){
            if(p.permissions.policiesPublic[i].name != '' && policy_exist.indexOf(p.permissions.policiesPublic[i].name) == -1){
                insert_rolevalues.push({
                    name: p.permissions.policiesPublic[i].name,
                    policy: p.permissions.policiesPublic[i].policy,
                    ispublic: 1
                })
            }
        }

        if(insert_rolevalues.length > 0){
            var sql = insert('menu').values(insert_rolevalues).toParams({placeholder: '?'})
            const promise = db.query(sql.text, sql.values).catch((err) => {
                console.log('插入策略错误：' + err)
                process.exit()
            })
            promise.then(function(result){
                console.log('插入策略成功，总数：' + result.affectedRows)
            })
        }

    })

    return promise

}

merge_role_policy = function () {
    // step3 建立策略和角色的关系
    var role_policy = {}
    var role = {}
    var policy = {}
    for(var i in p.permissions.policies){
        var pobj = p.permissions.policies[i]
        for(var j in p.permissions.policies[i].role){
            var robj = p.permissions.policies[i].role[j]
            if(role_policy.hasOwnProperty(robj)) {
                if(role_policy[robj].indexOf(pobj.policy) == -1) {
                    role_policy[robj].push(pobj.policy)
                }
            }else{
                role_policy[robj] = [pobj.policy]
            }
        }
    }

    var sql = 'delete from role_menu'
    const promise = db.query(sql, []).catch((err) => {
        console.log('删除角色策略关系错误：' + err)
        process.exit()
    })
    promise.then(function(result){
        console.log('删除角色策略关系，总数：' + result.affectedRows)

        var sql = select().from('role') //^拼装sql
        sql = sql.toParams({placeholder: '?'}) //$拼装sql
        const promise2 = db.query(sql.text, sql.values).catch((err) => {
            console.log('查询角色错误：' + err)
            process.exit()
        })
        promise2.then(function(result){
            for(var i in result){
                role[result[i].name] = result[i].id
            }
            var sql = select().from('menu') //^拼装sql
            sql = sql.toParams({placeholder: '?'}) //$拼装sql
            const promise3 = db.query(sql.text, sql.values).catch((err) => {
                console.log('查询策略错误：' + err)
                process.exit()
            })
            promise3.then(function(result){
                for(var i in result) {
                    policy[result[i].policy] = result[i].id
                }

 
                var insert_rolevalues = []
                for(var r in role_policy){
                    role_name = r
                    for(var p in role_policy[r]){
                        policy_name = role_policy[r][p]
                        insert_rolevalues.push({
                            menuid: policy[policy_name], 
                            roleid: role[role_name]
                        })
                    }
                }

                var sql = insert('role_menu').values(insert_rolevalues).toParams({placeholder: '?'})
                const promise4 = db.query(sql.text, sql.values).catch((err) => {
                    console.log('插入角色策略关系错误：' + err)
                    process.exit()
                })
                promise4.then(function(result){
                    console.log('更新角色策略关系成功，总数：' + result.affectedRows)
                    console.log('Success')
                    process.exit()
                })


            })

        })
    })

    return promise
}

add_role()
add_policy()
merge_role_policy()