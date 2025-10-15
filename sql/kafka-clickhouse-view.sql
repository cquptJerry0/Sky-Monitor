-- 创建埋点数据写入表
CREATE TABLE kafka_monitor (key String, value String) ENGINE = Kafka SETTINGS kafka_broker_list = 'localhost:9092',
kafka_topic_list = 'monitor',
kafka_group_name = 'monitor',
kafka_format = 'JSONEachRow',
kafka_num_consumers = 1;

-- 创建数据查询
CREATE TABLE monitor_data AS kafka_monitor ENGINE = MergeTree ()
ORDER BY tuple ();

-- 创建物化视图
CREATE MATERIALIZED VIEW kafka_to_monitor_data TO monitor_data AS
SELECT *
FROM kafka_monitor;

-- 查询
SELECT * FROM kafka_to_monitor_data