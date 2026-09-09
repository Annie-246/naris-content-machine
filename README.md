# Naris Content Machine

Công cụ phân tích và sản xuất nội dung cho các thương hiệu Naris: dò nội dung đang chạy tốt trên mạng xã hội,
tải video về cho AI xem trực tiếp, bóc kịch bản, viết bài mới và chấm điểm nội dung theo Brand DNA.

Mở app lần đầu đã có sẵn bốn thương hiệu: **Parasola by Naris Up**, **Naris Up Skincare**,
**Ailus Stress Free & Makeup** và **Day 365+**. Mọi prompt gửi cho AI đều sinh ra từ hồ sơ thương hiệu đang chọn.

## Tính năng

| Mục | Làm gì |
|---|---|
| **Content Radar** | Dò nội dung theo từ khoá hoặc theo đối thủ trên TikTok, Douyin, Instagram, YouTube. Xếp hạng theo lượt xem / tương tác, lọc theo khoảng thời gian, gợi ý từ khoá bằng AI, xuất CSV hoặc Google Sheet |
| **Content Waterfall** | Một nguồn bất kỳ (bài viết, video, podcast, báo cáo, ghi chú thô) thành bản đồ 10–30 cơ hội nội dung theo mục tiêu |
| **Content Creator** | Remake kịch bản video, phân tích sâu video, trích script, tạo kịch bản từ ý tưởng, remake bài viết, viết bài mới, phân tích sâu bài viết |
| **Chấm điểm nội dung** | Chấm video và bài viết theo bộ tiêu chí bạn tự nạp, chỉ rõ từng chỗ mất điểm và cách sửa |
| **Brand DNA** | Quản lý nhiều thương hiệu, học Brand DNA tự động từ nội dung có sẵn, xuất / nhập JSON |
| **Danh mục sản phẩm** | Tải lên bảng sản phẩm của từng thương hiệu; mỗi lần chạy chọn sản phẩm cần nói tới để AI bám đúng tên, công dụng và thông số thay vì nói chung chung |
| **Lịch sử nội dung** | Lưu lại mọi lần chạy, xem lại, xuất ra file |

## Tải app Windows và bắt đầu

Bản đóng gói sẵn nằm ở trang [Releases](https://github.com/Annie-246/naris-content-machine/releases/latest),
không cần cài Node.js.

1. **Tải**: kéo xuống mục *Assets* rồi chọn đúng bản của máy bạn.

   | Máy | File cần tải |
   |---|---|
   | Windows | `Naris.Content.Machine.Setup.<phiên bản>.exe` (bản cài, có shortcut) hoặc `Naris.Content.Machine.<phiên bản>.exe` (chạy ngay) |
   | Mac chip Apple (M1/M2/M3/M4) | File `.dmg` có `arm64` trong tên |
   | Mac chip Intel | File `.dmg` có `x64` trong tên |

   Không rõ máy Mac của mình chip gì thì bấm  → *About This Mac*: dòng *Chip* ghi Apple M... là arm64,
   ghi Intel là x64.

2. **Mở lần đầu**: app chưa mua chữ ký số nên cả hai hệ điều hành đều cảnh báo một lần.

   - **Windows**: hiện "Windows protected your PC" → bấm *More info* → *Run anyway*. Bản Setup thì *Next* → *Install*.
   - **macOS**: mở file `.dmg`, kéo app vào thư mục Applications. Mở lần đầu sẽ hiện
     *"Apple could not verify..."* — đó là vì app chưa công chứng với Apple, không phải app hỏng. Cách bỏ chặn:

     | Cách | Làm gì |
     |---|---|
     | Nhanh nhất, mọi phiên bản macOS | Mở Terminal, dán `xattr -dr com.apple.quarantine "/Applications/Naris Content Machine.app"` rồi Enter, sau đó mở app bình thường |
     | Không cần Terminal | Bấm mở app cho nó báo lỗi, rồi vào  → *System Settings* → *Privacy & Security*, cuộn xuống mục Security bấm **Open Anyway** |

     Mẹo *chuột phải → Open* chỉ còn tác dụng tới macOS 14; **macOS 15 (Sequoia) đã bỏ đường tắt này**,
     phải dùng một trong hai cách trên.
3. **API key**: lấy key Gemini miễn phí tại https://aistudio.google.com/apikey, vào mục **Tích hợp** ở menu trái,
   dán vào ô Google Gemini rồi *Lưu*. Key chỉ lưu trên máy bạn.
4. **Content Radar và video Douyin**: dán thêm API key [TikHub](https://user.tikhub.io/dashboard/api) ở mục
   **Tích hợp**, phần *Nguồn dữ liệu*. Douyin chặn mọi cách tải tự động khác nên đây là đường duy nhất;
   các nền tảng còn lại không cần key này.

Bản đóng gói đã mang sẵn `yt-dlp` và `ffmpeg`, nên không phải cài Python hay bất cứ thứ gì khác.

## Yêu cầu hệ thống

**Dùng bản cài sẵn (Windows hoặc macOS)**: không cần cài gì thêm. `yt-dlp` và `ffmpeg` nằm sẵn trong bộ cài
(`resources/vendor`), app tự tìm và dùng.

**Chạy từ mã nguồn**:

| Thành phần | Bắt buộc | Dùng để làm gì |
|---|---|---|
| Node.js 20 trở lên | Có | Chạy app và máy chủ |
| `yt-dlp` + `ffmpeg` | Có | Tải video từ TikTok, YouTube, Facebook, Instagram và ghép hình với tiếng |
| API key TikHub | Cho Douyin và Radar | Douyin chặn yt-dlp (lỗi 403 kể cả khi có cookie), nên video Douyin tải qua TikHub: dán key ở Tích hợp → Nguồn dữ liệu hoặc đặt `TIKHUB_API_KEY` |

Lấy đúng hai file mà bộ cài dùng, tải về `vendor/`:

```bash
npm run vendor
```

Lệnh này chạy sẵn trước `npm run dist`. Muốn cập nhật lên bản mới nhất thì chạy
`node scripts/fetch-vendor.mjs --force` — nên làm khi thấy link TikTok hay YouTube bắt đầu lỗi, vì các
nền tảng đổi cơ chế chặn thường xuyên.

Máy nào đã có sẵn `yt-dlp` và `ffmpeg` trong PATH thì app dùng luôn bản đó, không cần `vendor/`.

## Chạy ở máy local

```bash
npm install
npm run dev
```

Mở http://localhost:3100

## Build và chạy bản production

```bash
npm install
npm run build     # tạo thư mục dist/
npm start         # chạy máy chủ phục vụ dist/ và các API
```

`npm start` chạy [server/production.mjs](server/production.mjs) — nó vừa phục vụ giao diện đã build,
vừa xử lý `/api/*`. Không dùng `vite preview` để deploy: lệnh đó chỉ phục vụ file tĩnh, mọi tính năng
gọi AI và tải video sẽ hỏng.

## Đóng gói

```bash
npm run dist      # bản Windows: tự chạy npm run vendor rồi electron-builder
npm run dist:mac  # bản macOS - chỉ chạy được TRÊN máy macOS
```

Kết quả nằm trong `release/`.

**Bản macOS không dựng được từ Windows**: electron-builder cần chính macOS để tạo `.dmg`. Vì vậy
[.github/workflows/release.yml](.github/workflows/release.yml) dựng cả hai bản trên máy của GitHub - đẩy một
tag là xong:

```bash
git tag -a v1.0.1 -m "Naris Content Machine 1.0.1"
git push origin v1.0.1
```

Workflow chạy test, build, tải `yt-dlp` + `ffmpeg` đúng hệ điều hành, đóng gói rồi đính kèm file vào
trang Releases.

**Về chữ ký số**: bản macOS được ký ad-hoc (`identity: "-"`) — đủ để app chạy trên Apple Silicon, nơi
macOS từ chối hẳn app không có chữ ký. Nhưng ad-hoc không phải công chứng: muốn hết cảnh báo Gatekeeper
thì cần tài khoản Apple Developer (99\$/năm) để ký bằng Developer ID rồi notarize. Chừng nào chưa có,
người dùng phải bỏ chặn một lần theo hướng dẫn ở phần tải app. Bản Windows cũng tương tự, chưa mua
chứng chỉ ký mã nên hiện cảnh báo SmartScreen một lần.

## Biến môi trường

Đặt trong `.env.local` khi chạy local, hoặc trong cấu hình môi trường khi deploy.

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `GEMINI_API_KEY` | Không | Key dùng chung cho cả hệ thống. Có key này thì người dùng không cần tự nhập. Bỏ trống thì mỗi người tự dán key ở mục **Tích hợp** |
| `PORT` | Không | Cổng máy chủ, mặc định `3100` |
| `HOST` | Không | Địa chỉ lắng nghe, mặc định `0.0.0.0` |
| `YTDLP_PATH` | Không | Đường dẫn tới yt-dlp riêng, ưu tiên hơn bản đi kèm |
| `FFMPEG_PATH` | Không | Đường dẫn tới ffmpeg riêng, ưu tiên hơn bản đi kèm |
| `YTDLP_IMPERSONATE` | Không | Trình duyệt giả lập, mặc định `chrome` |
| `YTDLP_COOKIES_FROM_BROWSER` | Không | Mượn cookie trình duyệt cho video riêng tư, ví dụ `chrome` |
| `YTDLP_COOKIES_FILE` | Không | Dùng file `cookies.txt` thay cho mượn cookie trình duyệt |
| `TIKHUB_API_KEY` | Cho Douyin và Radar | Key TikHub dự phòng phía máy chủ khi trình duyệt chưa dán key |
| `APIFY_API_TOKEN` | Không | Nguồn dự phòng cho Radar Douyin |

Lấy key Gemini tại https://aistudio.google.com/apikey

## Brand DNA

Bốn thương hiệu Naris có sẵn khi mở app lần đầu. Từ đó:

- Thêm thương hiệu mới: menu chọn brand ở thanh trên, hoặc nút **Thêm brand** ở banner.
- Chuyển thương hiệu: chọn trong menu ở thanh trên.
- Chia sẻ Brand DNA: mở **Quản lý Brand** ➔ **Xuất JSON** / **Nhập JSON**.
- Học tự động: nút **Học Brand DNA** đọc nội dung có sẵn của thương hiệu rồi điền giúp form.

Hai trường tùy chọn đáng chú ý trong form:

- **Khối Footer Cố Định**: nếu điền, AI sẽ chèn nguyên văn khối này ở cuối mọi bài đăng social.
- **Bộ Hashtag Mặc Định**: nếu để trống, AI tự đề xuất hashtag theo chủ đề.

Dữ liệu Brand DNA lưu trong `localStorage` của trình duyệt, không gửi đi đâu ngoài prompt cho AI.

## Danh mục sản phẩm

Mục **14. Danh Mục Sản Phẩm** trong hộp thoại Brand DNA nhận file danh sách sản phẩm của thương hiệu:

| Định dạng | Cách chuẩn bị |
|---|---|
| `.csv` / `.tsv` | Xuất từ Excel hoặc Google Sheet (*File → Download → CSV*). Dòng đầu là tên cột, cần có cột tên sản phẩm |
| `.json` | File do chính app này xuất ra, dùng khi chuyển sang máy khác |
| `.txt` / `.md` | Mỗi sản phẩm một khối, cách nhau bằng dòng trống, dòng đầu là tên |

Cột nào cũng được giữ lại kèm tên cột, nên bảng có dung tích, giá, thành phần, đối tượng phù hợp thì AI
đọc được hết. Tải lại đúng file đó lần nữa thì sản phẩm trùng tên được cập nhật chứ không nhân đôi.

Khi chạy bất kỳ tính năng nào, ô **Sản phẩm nhắc tới trong bài** cho chọn sản phẩm liên quan:

- **Có chọn**: prompt mang đầy đủ chi tiết của đúng những sản phẩm đó, kèm quy tắc cấm bịa thêm thông số.
- **Không chọn**: AI chỉ nhận danh sách tên, đủ để không nhắc tới sản phẩm không tồn tại.

Chọn đúng cái đang cần nói quan trọng với ngành mỹ phẩm: đổ cả danh mục vào thì bài viết ra loãng, mà
thiếu chi tiết thì model dễ tự suy ra chỉ số chống nắng hay thành phần không có thật.

## Về API key

Bản build **không nhúng key vào mã nguồn phía trình duyệt**. Mọi lời gọi AI đều đi qua máy chủ:

- Có `GEMINI_API_KEY` trên máy chủ: người dùng mở app là dùng được ngay.
- Không có: người dùng vào mục **Tích hợp**, dán key của họ. Key lưu trong trình duyệt của từng người.

Key người dùng tự nhập được ưu tiên hơn key máy chủ.

## Chọn nhà cung cấp AI

Mục **Tích hợp** cho phép gán từng nhóm việc cho từng nhà cung cấp:

| Nhóm việc | Nhà cung cấp dùng được |
|---|---|
| Phân tích video | Chỉ Google Gemini — các bên khác không nhận video làm đầu vào |
| Nội dung văn bản | Gemini, OpenAI, Anthropic Claude, DeepSeek |
| Tạo hình ảnh | Chỉ Google Gemini |

Yêu cầu nào có video hoặc ảnh sẽ tự động chạy bằng Gemini, bất kể phân công.

## Deploy

App cần chạy được tiến trình Node **và** gọi được yt-dlp cùng ffmpeg, nên phải deploy lên nơi có toàn quyền hệ thống:
VPS, Railway, Render, Fly.io, hoặc container.

Không dùng được: Vercel, Netlify, Cloudflare Workers, GitHub Pages — các nền tảng này không chạy được
yt-dlp và ffmpeg.

### Docker

```bash
docker build -t naris-content-machine .
docker run -p 3100:3100 -e GEMINI_API_KEY=your_key naris-content-machine
```

### VPS

```bash
git clone https://github.com/Annie-246/naris-content-machine.git && cd naris-content-machine
npm install
npm run build
npm run vendor
GEMINI_API_KEY=your_key PORT=3100 npm start
```

Nên chạy qua `pm2` hoặc systemd để tự khởi động lại, và đặt nginx phía trước để có HTTPS.

## Giới hạn đã biết

- Video dài quá 15 phút hoặc nặng quá 150MB sẽ bị từ chối.
- TikTok thỉnh thoảng chặn ngẫu nhiên; máy chủ tự thử lại 7 lần trước khi báo lỗi.
- Video Facebook và Instagram riêng tư cần cookie, xem biến `YTDLP_COOKIES_*`.
- Video đã tải được lưu trên Gemini 48 giờ; máy chủ nhớ trong 40 giờ để khỏi tải lại.
- Content Radar cần API key TikHub cho TikTok, Douyin và Instagram; YouTube dùng nguồn riêng.
