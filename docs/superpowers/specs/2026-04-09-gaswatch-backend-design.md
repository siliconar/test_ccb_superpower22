# GasWatch 后端设计规范

**日期**: 2026-04-09
**项目**: GasWatch
**Tech Stack**: Go + Gin + SQLite (`go-sqlite3`) + `mattn/go-sqlite3`

---

## 1. 概述

为 GasWatch 前端提供 REST API，数据来源为卫星探测羽流原始数据（`_META.json` + `_PLUME.tif`）。

**核心能力**：
1. 数据导入 CLI：将 rawdata 目录解析入 SQLite
2. REST API：支持过滤查询、单条详情、TIFF 文件服务、统计数据
3. 前端只需将 `environment.useMock` 改为 `false` 即可接入真实 API

---

## 2. 项目结构

```
gas-backend/
├── cmd/
│   ├── server/
│   │   └── main.go          # HTTP server 入口（Gin）
│   └── import/
│       └── main.go          # 数据导入 CLI 工具
├── internal/
│   ├── model/
│   │   └── plume.go         # Go struct（对应前端 Plume interface）
│   ├── repository/
│   │   └── plume_repo.go    # SQLite CRUD
│   ├── handler/
│   │   └── plume_handler.go # Gin 路由处理器
│   └── db/
│       └── db.go            # 数据库连接 & schema migrate
├── data/
│   └── gas.db               # SQLite 数据库（gitignore）
└── go.mod
```

**关键决策**：
- `cmd/import` 是独立 CLI，不内嵌在 server 中，职责分离
- `internal/` 三层架构（model → repository → handler）防止循环依赖
- `data/gas.db` 不入 git

---

## 3. 数据模型

### 3.1 Go Struct

```go
// internal/model/plume.go
type Plume struct {
    ID                        string    `json:"id"`
    Satellite                 string    `json:"satellite"`
    Payload                   string    `json:"payload"`
    ProductLevel              string    `json:"productLevel"`
    OverpassTime              time.Time `json:"overpassTime"`
    Longitude                 float64   `json:"longitude"`
    Latitude                  float64   `json:"latitude"`
    Country                   string    `json:"country"`
    Sector                    string    `json:"sector"`
    GasType                   string    `json:"gasType"`    // 从目录名解析：CH4/CO/NO2
    FluxRate                  float64   `json:"fluxRate"`
    FluxRateStd               float64   `json:"fluxRateStd"`
    WindU                     float64   `json:"windU"`
    WindV                     float64   `json:"windV"`
    WindSpeed                 float64   `json:"windSpeed"`
    DetectionInstitution      string    `json:"detectionInstitution"`
    QuantificationInstitution string    `json:"quantificationInstitution"`
    FeedbackOperator          string    `json:"feedbackOperator"`
    FeedbackGovernment        string    `json:"feedbackGovernment"`
    AdditionalInformation     string    `json:"additionalInformation"`
    SharedOrganization        string    `json:"sharedOrganization"`
    Geometry                  string    `json:"geometry"`   // GeoJSON Polygon string
    TiffPath                  string    `json:"tiffPath"`   // 相对路径
}
```

### 3.2 SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS plumes (
    id                         TEXT PRIMARY KEY,
    satellite                  TEXT,
    payload                    TEXT,
    product_level              TEXT,
    overpass_time              TEXT,
    longitude                  REAL,
    latitude                   REAL,
    country                    TEXT,
    sector                     TEXT,
    gas_type                   TEXT,
    flux_rate                  REAL,
    flux_rate_std              REAL,
    wind_u                     REAL,
    wind_v                     REAL,
    wind_speed                 REAL,
    detection_institution      TEXT,
    quantification_institution TEXT,
    feedback_operator          TEXT,
    feedback_government        TEXT,
    additional_information     TEXT,
    shared_organization        TEXT,
    geometry                   TEXT,  -- GeoJSON Polygon string
    tiff_path                  TEXT
);

CREATE INDEX IF NOT EXISTS idx_gas_type      ON plumes(gas_type);
CREATE INDEX IF NOT EXISTS idx_overpass_time ON plumes(overpass_time);
CREATE INDEX IF NOT EXISTS idx_flux_rate     ON plumes(flux_rate);
```

**`gas_type` 解析规则**：从目录名正则匹配 `_CH4_`、`_CO_`、`_NO2_`。

---

## 4. 数据导入

### 4.1 输入格式

每个 rawdata 子目录包含：
- `*_META.json`：GeoJSON FeatureCollection，含一个 Feature，properties 为所有字段
- `*_PLUME.tif`：GeoTIFF 文件

### 4.2 Phase 1：单条导入

```
go run ./cmd/import --dir data/rawdata/GAOFEN-5-01A_AHSI_L2B_20230319T200543_CH4_PLUME_V1_20251125_A0000092
```

流程：
1. 找到目录下 `*_META.json` 和 `*_PLUME.tif`
2. 解析 META.json → Plume struct（映射 properties 字段名）
3. 从目录名提取 `gas_type`（正则：`_(CH4|CO|NO2)_`）
4. `tiff_path` = TIFF 文件相对项目根目录的路径
5. `INSERT OR REPLACE INTO plumes`（幂等）

### 4.3 Phase 2：批量导入

```
go run ./cmd/import --root data/rawdata
```

- 遍历 `--root` 下所有子目录
- 每个子目录执行 Phase 1 同一套逻辑
- 单条失败不中断批量，记录错误继续
- 完成后打印：`imported N / skipped M / errors K`

---

## 5. API 端点

### 5.1 路由一览

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/plumes` | 列表查询（支持过滤） |
| `GET` | `/api/plumes/:id` | 单条详情 |
| `GET` | `/api/plumes/:id/tiff` | 返回 TIFF 文件 |
| `GET` | `/api/stats` | 统计数据 |

### 5.2 GET /api/plumes 过滤参数

| 参数 | 类型 | 示例 |
|------|------|------|
| `gasType` | string | `CH4,CO` |
| `dateFrom` | string (ISO) | `2023-01-01` |
| `dateTo` | string (ISO) | `2023-12-31` |
| `fluxMin` | float | `500` |
| `fluxMax` | float | `2000` |
| `satellite` | string | `GAOFEN-5-01A` |
| `sector` | string | `Oil and Gas` |

响应：
```json
{
  "data": [ ...Plume ],
  "total": 42
}
```

### 5.3 GET /api/stats 响应

```json
{
  "totalDetections": 42,
  "countriesCount": 15,
  "gasTypesCount": 3,
  "latestDetectionDate": "2023-03-19T20:05:43Z"
}
```

### 5.4 GET /api/plumes/:id/tiff

- 读取数据库中 `tiff_path` 字段
- 返回文件，`Content-Type: image/tiff`
- 文件不存在 → 404

---

## 6. CORS & 中间件

- 开发环境允许 `http://localhost:4200`（Angular dev server）
- 使用 `github.com/gin-contrib/cors` 中间件
- 生产环境 origin 通过环境变量 `ALLOWED_ORIGIN` 配置

---

## 7. 前端接入

切换真实 API 只需修改一处：

```typescript
// gas-frontend/src/environments/environment.ts
export const environment = {
  production: false,
  useMock: false,   // 改为 false
  apiUrl: 'http://localhost:8080'
};
```

零组件改动，服务抽象层处理剩余所有逻辑。

---

## 8. 成功标准

- [ ] `go run ./cmd/import --dir ...` 成功导入 A0000092，数据库有 1 条记录
- [ ] `GET /api/plumes` 返回正确 JSON，字段与前端 `Plume` interface 完全匹配
- [ ] `GET /api/plumes/A0000092/tiff` 成功返回 TIFF 文件
- [ ] `GET /api/stats` 返回正确统计
- [ ] 前端 `useMock: false` 后地图正常显示真实数据
- [ ] `go run ./cmd/import --root ...` 批量导入无崩溃

---

**End of Design Specification**
