户房通
1.git clone git@47.94.207.120:/home/gitrepo/hufangtong.git

一：api文档在线管理：
https://www.showdoc.cc/web/#/44666958361645?page_id=254454542347676
注册账号，然后我添加权限可以共同维护api文档。


二：目录结构
FrontEnd:前台项目
server：后台项目目录
数据库初始化sql：hufangtong.sql


三：mysql
导入行政区修改默认大小 https://github.com/kakuilan/china_area_mysql
mysql> set GLOBAL max_allowed_packet=1024*1024*1024;

sql-bricks: http://csnw.github.io/sql-bricks/
knexjs: http://knexjs.org/


四：权限控制机制

主体关系：用户 <-n:m-> 角色 <-n:m-> 策略

策略名称规范：[模块].[接口]::[HTTP请求方法] （都是小写）
exp1: 查询我的团队列表的接口的策略名称为：user.list::get
策略属性只有一个：isPublic表示这个接口是否是公共接口，如果是公共接口就可以跳过验证

策略导入方法：使用脚本将api/route下的文件和接口按照规范的名称导入到数据库
    - node bin/import_permissions.js

权限控制函数：utils.check_permission，在config.js中可以配置是否跳过认证

目前角色策略关联的文档见：权限菜单目录