const TRAINING_DATA = {
  "competencies": [
    {
      "group": "N4 – LÃNH ĐẠO & PHÁT TRIỂN TỔ CHỨC (Trọng số: 30%) — Quan trọng nhất với CEO",
      "code": "N4.1",
      "name": "Tầm nhìn chiến lược & Định hướng tổ chức",
      "level1": "Không có chiến lược rõ ràng. Phản ứng với sự kiện thay vì dẫn dắt. Đội ngũ không biết đi về đâu.",
      "level2": "Có chiến lược nhưng không cascade được xuống tổ chức. GĐ cấp dưới mơ hồ về ưu tiên.",
      "level3": "Chiến lược rõ, được phê duyệt HĐQT, cascade đến từng phòng với OKR cụ thể. Toàn đội hiểu mình tạo ra GMV thế nào.",
      "level4": "Chiến lược 3 năm được HĐQT tin tưởng. Là người dẫn dắt ngành. Đội ngũ tự nguyện theo vì tin vào tầm nhìn CEO."
    },
    {
      "group": "N4 – LÃNH ĐẠO & PHÁT TRIỂN TỔ CHỨC (Trọng số: 30%) — Quan trọng nhất với CEO",
      "code": "N4.2",
      "name": "Xây dựng & Phát triển đội ngũ cấp cao",
      "level1": "Không tuyển được người tốt hơn mình. Team C-Suite thiếu hụt liên tục. Hay làm thay GĐ cấp dưới.",
      "level2": "Tuyển được nhưng hay mất người giỏi sau 6-12 tháng. Chưa có succession plan. Coaching chưa có hệ thống.",
      "level3": "C-Suite đủ quân, ổn định. Mỗi GĐ có IDP và đang phát triển rõ rệt. CEO vắng 2 tuần công ty vẫn chạy tốt.",
      "level4": "Xây được bench strength — mỗi vị trí key có 2 người kế thừa sẵn sàng. Vimove là nơi người giỏi muốn đến làm."
    },
    {
      "group": "N4 – LÃNH ĐẠO & PHÁT TRIỂN TỔ CHỨC (Trọng số: 30%) — Quan trọng nhất với CEO",
      "code": "N4.3",
      "name": "Ra quyết định trong môi trường bất định",
      "level1": "Chờ đủ thông tin mới quyết định. Hay hỏi ý kiến quá nhiều người rồi vẫn không quyết. Đội ngũ chờ CEO và chậm.",
      "level2": "Quyết định được nhưng thường chậm 1-2 tuần. Hay thay đổi quyết định sau khi nhận phản hồi — không nhất quán.",
      "level3": "Ra quyết định trong 24-48h với thông tin 70%. Nhất quán. Sẵn sàng điều chỉnh nhanh khi có data mới — không phải vì áp lực.",
      "level4": "Quyết định chiến lược lớn được HĐQT và đội ngũ tin tưởng. Có framework ra quyết định rõ. Không bao giờ là bottleneck."
    },
    {
      "group": "N4 – LÃNH ĐẠO & PHÁT TRIỂN TỔ CHỨC (Trọng số: 30%) — Quan trọng nhất với CEO",
      "code": "N4.4",
      "name": "Coaching & Phát triển lãnh đạo cấp dưới",
      "level1": "Không có thời gian coaching. Hay giải quyết vấn đề thay vì hỏi để GĐ tự tìm ra. Đội ngũ phụ thuộc CEO.",
      "level2": "Có 1-1 nhưng không có cấu trúc. Chủ yếu nghe báo cáo chứ không coaching thực sự. GĐ không lớn lên rõ rệt.",
      "level3": "1-1 monthly có cấu trúc (review KPI + IDP + tâm lý). GĐ cảm thấy được hỗ trợ. Có ít nhất 1 GĐ được thăng tiến/năm.",
      "level4": "CEO là coach thực thụ — GĐ cấp dưới coi 1-1 với CEO là nguồn phát triển quan trọng nhất. Nhiều GĐ có thể trở thành CEO."
    },
    {
      "group": "N2 – DATA & TƯ DUY KINH DOANH TMĐT (Trọng số: 20%)",
      "code": "N2.1",
      "name": "Đọc và ra quyết định từ P&L TMĐT",
      "level1": "Không đọc được P&L. Ra quyết định cảm tính. Không biết channel nào lời/lỗ.",
      "level2": "Đọc được P&L cơ bản nhưng không phân tích được nguyên nhân gốc rễ. Hay tin vào số GĐ báo cáo mà không verify.",
      "level3": "Đọc P&L toàn công ty, phân tích được GMV theo sàn/SKU/kênh, GP%, chi phí cố định/biến động. Ra action plan từ số.",
      "level4": "Xây model tài chính tự động. Dự báo cash flow 3-6 tháng chính xác ≥ 80%. HĐQT tin tưởng số CEO báo cáo."
    },
    {
      "group": "N2 – DATA & TƯ DUY KINH DOANH TMĐT (Trọng số: 20%)",
      "code": "N2.2",
      "name": "Tư duy TMĐT & Hiểu thuật toán sàn",
      "level1": "Không hiểu cách sàn vận hành. Ra chiến lược không tương thích với thuật toán sàn. Đội chạy theo mà không hiểu vì sao.",
      "level2": "Hiểu bề mặt — biết ROAS, GMV, conversion là gì nhưng không hiểu sâu. Không nhận ra khi GĐ báo cáo số thiếu context.",
      "level3": "Hiểu đủ để hỏi đúng câu hỏi: ROAS theo kênh/SKU/creative, ranking từ khóa, conversion funnel. Không bị GĐ 'dắt mũi' bằng số.",
      "level4": "Biết đủ về thuật toán sàn để đặt câu hỏi chiến lược sắc bén. Đề xuất chiến lược platform mà đội phải nghiên cứu thêm."
    },
    {
      "group": "N5 – PHỐI HỢP & GIAO TIẾP (Trọng số: 15%)",
      "code": "N5.1",
      "name": "Giao tiếp với HĐQT & Nhà đầu tư",
      "level1": "Báo cáo HĐQT dài dòng, không có insight, toàn số liệu không có ý kiến. HĐQT hay phải hỏi lại nhiều.",
      "level2": "Báo cáo đủ số nhưng thiếu narrative — không kể được câu chuyện kinh doanh. HĐQT không tự tin vào con số.",
      "level3": "Báo cáo ngắn gọn: số thực tế vs KH, nguyên nhân lệch, action plan, rủi ro và cơ hội. HĐQT nhận báo cáo không cần hỏi thêm.",
      "level4": "HĐQT coi CEO là đối tác chiến lược thực sự. Trình bày hấp dẫn, thuyết phục được HĐQT đồng ý phân bổ nguồn lực thêm."
    },
    {
      "group": "N5 – PHỐI HỢP & GIAO TIẾP (Trọng số: 15%)",
      "code": "N5.2",
      "name": "Truyền thông nội bộ & Tạo alignment",
      "level1": "Đội ngũ không biết chiến lược công ty. Mỗi phòng làm một hướng. CEO announce mà không ai hiểu.",
      "level2": "Có all-hands nhưng thông tin một chiều. Không có cơ chế feedback từ nhân viên lên CEO. Tin đồn nhiều hơn thông tin chính thức.",
      "level3": "All-hands hàng tháng có Q&A thực sự. Chiến lược cascade rõ. Nhân viên cảm thấy được thông tin đầy đủ và tin tưởng.",
      "level4": "CEO là người kết nối văn hóa. Nhân viên cảm thấy 'được biết' và 'được nghe'. eNPS tăng sau mỗi all-hands."
    },
    {
      "group": "N1 – CHUYÊN MÔN TMĐT (Trọng số: 15%) — CEO cần hiểu, không cần thao tác trực tiếp",
      "code": "N1.1",
      "name": "Hiểu hệ sinh thái TMĐT vali Việt Nam",
      "level1": "Không biết sàn nào phù hợp để ưu tiên. Không hiểu sự khác biệt Shopee/TikTok/Lazada. Ra chiến lược sai kênh.",
      "level2": "Hiểu bề mặt — biết 3 sàn chính nhưng không hiểu dynamics đặc thù ngành vali. Không đánh giá được strategy của GĐ KD.",
      "level3": "Hiểu đủ để ra chiến lược đúng hướng: sàn nào ưu tiên theo mùa, kênh nào phù hợp SKU nào, khi nào cần tăng ads.",
      "level4": "Có góc nhìn macro về tương lai TMĐT vali VN — live commerce, social commerce, D2C — và đề xuất hướng đi trước thị trường."
    },
    {
      "group": "N3 – TỐC ĐỘ & EXECUTION (Trọng số: 10%)",
      "code": "N3.1",
      "name": "Tốc độ ra quyết định và triển khai",
      "level1": "Bottleneck quyết định. Mọi việc phải chờ CEO. Hay yêu cầu thêm data trước khi quyết định dù data đã đủ.",
      "level2": "Quyết định được nhưng chậm. Campaign sàn bỏ lỡ vì approval process mất quá lâu. Đội nản.",
      "level3": "Delegate đúng cấp — CEO chỉ quyết định những gì cần CEO. Còn lại ủy quyền và trust. Phản ứng nhanh khi có crisis.",
      "level4": "Đã xây hệ thống authorization levels rõ ràng. 80% quyết định hàng ngày không cần CEO. CEO chỉ làm việc chiến lược."
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N6.1",
      "name": "Ownership & Accountability ở cấp CEO",
      "level1": "Đổ lỗi thị trường, đối thủ, sàn thay đổi thuật toán khi GMV miss. Không nhận trách nhiệm trước HĐQT.",
      "level2": "Nhận trách nhiệm bề ngoài nhưng bên trong vẫn blame team. Giải thích quá nhiều thay vì hành động.",
      "level3": "\"Own the number\" — trước HĐQT nhận trách nhiệm, với team phân tích nguyên nhân khách quan và ra plan. Không bao giờ đổ lỗi công khai.",
      "level4": "CEO là người cân bằng accountability cao nhất: nhận trách nhiệm với HĐQT, bảo vệ team khi cần, nhưng không dung thứ thiếu ownership từ GĐ."
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N6.2",
      "name": "Growth mindset & Học từ thất bại",
      "level1": "Sợ thất bại. Không thử chiến lược mới. Văn hóa công ty né tránh rủi ro — cơ hội bị bỏ lỡ vì không ai dám thử.",
      "level2": "Nói về growth mindset nhưng phản ứng tiêu cực khi đội thất bại. Team học được: 'đừng mang tin xấu lên CEO'.",
      "level3": "Công khai chia sẻ bài học từ thất bại của mình. Team cảm thấy an toàn để thử và báo cáo thất bại. Post-mortem có văn hóa.",
      "level4": "Thất bại được xem là dữ liệu — CEO setup môi trường nơi 'fail fast, learn faster' là chuẩn mực. Vimove có knowledge base các bài học."
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "NHÓM NL",
      "name": "TRỌNG SỐ (%)",
      "level1": "MỨC ĐẠT TỐI THIỂU",
      "level2": "GHI CHÚ",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N4 – Lãnh đạo & Phát triển",
      "name": "30%",
      "level1": "Cấp 3 tất cả tiêu chí N4",
      "level2": "Đây là nhóm quyết định CEO thành/bại",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N2 – Data & Kinh doanh TMĐT",
      "name": "20%",
      "level1": "Cấp 3 tất cả tiêu chí N2",
      "level2": "Phải hiểu đủ để giám sát và ra chiến lược",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N5 – Giao tiếp & Phối hợp",
      "name": "15%",
      "level1": "Cấp 3",
      "level2": "Đặc biệt quan trọng với HĐQT",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N1 – Chuyên môn TMĐT",
      "name": "15%",
      "level1": "Cấp 2 tối thiểu, Cấp 3 lý tưởng",
      "level2": "CEO không cần thao tác nhưng phải hiểu",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N3 – Tốc độ & Execution",
      "name": "10%",
      "level1": "Cấp 3",
      "level2": "Delegation là năng lực cốt lõi ở cấp CEO",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "N6 – Tư duy & Thái độ",
      "name": "10%",
      "level1": "Cấp 3",
      "level2": "Văn hóa CEO = văn hóa công ty",
      "level3": "nan",
      "level4": "nan"
    },
    {
      "group": "N6 – TƯ DUY & THÁI ĐỘ (Trọng số: 10%)",
      "code": "TỔNG",
      "name": "100%",
      "level1": "Điểm tổng trọng số ≥ 2.7/4.0",
      "level2": "Điều kiện loại: bất kỳ tiêu chí N4 < Cấp 2",
      "level3": "nan",
      "level4": "nan"
    }
  ],
  "checklists": {
    "ceo_daily": [
      {
        "freq": "#",
        "task": "TẦN SUẤT",
        "action": "NỘI DUNG CÔNG VIỆC"
      },
      {
        "freq": "1",
        "task": "Hàng ngày",
        "action": "Xem dashboard GMV sàng sáng: Shopee, TikTok, Lazada — GMV hôm qua vs KH ngày, top SKU, bất thường nào?"
      },
      {
        "freq": "2",
        "task": "Hàng ngày",
        "action": "Check app Slack/Zalo: có alert nào từ GĐ cần phản hồi gấp? Có khủng hoảng nào mới phát sinh?"
      },
      {
        "freq": "3",
        "task": "Hàng ngày",
        "action": "Xem inbox email: HĐQT, sàn, NCC chiến lược. Không để email quan trọng chờ > 4h."
      },
      {
        "freq": "#",
        "task": "TẦN SUẤT",
        "action": "NỘI DUNG CÔNG VIỆC"
      },
      {
        "freq": "4",
        "task": "Thứ 2",
        "action": "Chủ trì họp BGĐ (30-45 phút): review GMV tuần qua, ROAS, top issues, quyết định phân bổ nguồn lực. Ghi chú quyết định + người thực thi + deadline."
      },
      {
        "freq": "5",
        "task": "Thứ 2",
        "action": "Đọc dashboard CEO đã cập nhật: GMV tuần vs KH tháng, ROAS trung bình, stock-out rate, turnover tháng này."
      },
      {
        "freq": "6",
        "task": "Thứ 4",
        "action": "1-1 với 1-2 GĐ trong tuần (luân phiên): review KPI, coaching, nhận phản hồi về quyết định của CEO. Không phải báo cáo — là đối thoại thực sự."
      },
      {
        "freq": "7",
        "task": "Thứ 5",
        "action": "Xem 5 competitor sàn: đối thủ chính đang chạy campaign gì, giá thế nào, review thế nào, ranking thế nào so với Vimove?"
      },
      {
        "freq": "8",
        "task": "Thứ 6",
        "action": "Gửi email/tin nhắn tuần cho toàn team (nếu có update quan trọng): cảm ơn, cập nhật chiến lược, recognizing thành tích nổi bật."
      },
      {
        "freq": "9",
        "task": "Thứ 6",
        "action": "Review quyết định tuần: quyết định nào tuần này đúng hướng? Quyết định nào cần điều chỉnh? Learning gì cho tuần sau?"
      },
      {
        "freq": "#",
        "task": "TẦN SUẤT",
        "action": "NỘI DUNG CÔNG VIỆC"
      },
      {
        "freq": "10",
        "task": "Ngày 1-5",
        "action": "Nhận và review báo cáo tháng từ từng GĐ: GMV, ROAS, KPI đạt/miss, nguyên nhân, action plan. Trả phản hồi bằng văn bản trong 48h."
      },
      {
        "freq": "11",
        "task": "Ngày 5",
        "action": "Họp review P&L tháng với GĐ Tài chính: GMV vs KH, GP%, chi phí thực tế vs ngân sách, EBITDA. Quyết định điều chỉnh phân bổ ngân sách nếu cần."
      },
      {
        "freq": "12",
        "task": "Ngày 5",
        "action": "All-hands tháng (nếu có update quan trọng) hoặc video/email CEO update: chiến lược tháng này, thành tích tháng trước, focus tháng này."
      },
      {
        "freq": "13",
        "task": "Ngày 10",
        "action": "Phê duyệt ngân sách marketing tháng tới: ngân sách ads theo sàn (Shopee/TikTok/Facebook), ngân sách content, ngân sách khác."
      },
      {
        "freq": "14",
        "task": "Ngày 15-20",
        "action": "1-1 monthly với từng GĐ trực tiếp: review KPI, IDP, tâm lý, nhu cầu hỗ trợ. CEO hỏi: 'Tôi đang làm gì cản trở bạn? Tôi cần thay đổi gì?'"
      },
      {
        "freq": "15",
        "task": "Ngày 20-25",
        "action": "Đàm phán/làm việc với đối tác tháng: AM sàn (xin thêm visibility, campaign ưu tiên), NCC (điều kiện thanh toán, đặt hàng trước mùa cao điểm)."
      },
      {
        "freq": "16",
        "task": "Ngày 25-28",
        "action": "Lên kế hoạch tháng tới: GMV target, campaign lớn nào, ưu tiên tổ chức nào, rủi ro nào cần chuẩn bị?"
      },
      {
        "freq": "17",
        "task": "Cuối tháng",
        "action": "Viết nhật ký lãnh đạo tháng (5-10 phút): quyết định lớn nhất tháng, bài học quan trọng nhất, điều cần làm khác tháng sau."
      },
      {
        "freq": "#",
        "task": "TẦN SUẤT",
        "action": "NỘI DUNG CÔNG VIỆC"
      },
      {
        "freq": "18",
        "task": "Hàng quý",
        "action": "Báo cáo HĐQT: P&L quý, GMV vs KH năm (pace), chiến lược, rủi ro, nhân sự cấp cao, kế hoạch quý tới. Trả lời mọi câu hỏi HĐQT có."
      },
      {
        "freq": "19",
        "task": "Hàng quý",
        "action": "Review OKR toàn công ty: mỗi phòng đạt/miss OKR quý nào? Nguyên nhân? Điều chỉnh OKR quý tới. Ăn mừng thành tích đạt OKR."
      },
      {
        "freq": "20",
        "task": "Hàng quý",
        "action": "Phân tích đối thủ sâu: 5 đối thủ chính đang làm gì tốt hơn Vimove? Vimove cần học gì/né gì?"
      },
      {
        "freq": "21",
        "task": "Hàng quý",
        "action": "Khảo sát eNPS: 2 câu cốt lõi + 3 câu mở. Chia sẻ kết quả với toàn công ty — kể cả điểm thấp và CEO cam kết cải thiện gì."
      },
      {
        "freq": "22",
        "task": "Hàng quý",
        "action": "Review succession plan: mỗi vị trí key (GĐ, TP quan trọng) có người kế thừa chưa? Ai cần được đầu tư phát triển thêm?"
      },
      {
        "freq": "23",
        "task": "Hàng quý",
        "action": "Workshop chiến lược BGĐ (2-4 tiếng): nhìn lại quý qua, điều chỉnh chiến lược quý tới. Không phải họp review — phải có output chiến lược mới."
      },
      {
        "freq": "24",
        "task": "Q4 hàng năm",
        "action": "Lập chiến lược năm tới: GMV target, kênh, tổ chức, đầu tư, văn hóa. Pitch HĐQT phê duyệt. Cascade chiến lược xuống toàn tổ chức."
      },
      {
        "freq": "25",
        "task": "Q4 hàng năm",
        "action": "Year-end review với toàn công ty: thành tích năm, bài học năm, cảm ơn đóng góp cá nhân nổi bật, tầm nhìn năm tới. Ăn mừng nếu đạt KPI."
      }
    ]
  },
  "courses": [
    {
      "module": "#",
      "name": "MODULE",
      "desc": "THÁNG",
      "duration": "NỘI DUNG CỐT LÕI"
    },
    {
      "module": "M1",
      "name": "Vai trò & Bức tranh Vimove",
      "desc": "T1",
      "duration": "Mô hình kinh doanh TMĐT vali. Vai trò từng phòng. Cách các phòng kết nối tạo ra GMV. KPI cascade toàn công ty."
    },
    {
      "module": "M2",
      "name": "Vận hành sàn & Thuật toán ranking",
      "desc": "T2",
      "duration": "Shopee algorithm: listing quality score, conversion, CTR, review, SLA. TikTok: watch time, engagement, affiliate seeding. Cách detect thay đổi sớm."
    },
    {
      "module": "M3",
      "name": "Data TMĐT & Dashboard CEO",
      "desc": "T3",
      "duration": "Shopee Business Insights, TikTok Seller Center analytics. KPI quan trọng: GMV, CTR, conversion, ROAS, CAC, LTV. CEO đọc data → ra quyết định → đo kết quả."
    },
    {
      "module": "M4",
      "name": "Ads & ROAS Management",
      "desc": "T4",
      "duration": "Shopee Ads (Search, Product Ads). TikTok Ads (In-Feed, Spark). Facebook/Meta Shopping. ROAS optimization, A/B testing concept. CEO không cần chạy — cần biết để giám sát."
    },
    {
      "module": "M5",
      "name": "P&L & Tài chính TMĐT",
      "desc": "T5",
      "duration": "Đọc P&L TMĐT: GMV → doanh thu thuần → GP% → chi phí → EBITDA. Working capital TMĐT. Cash flow planning. Phân bổ ngân sách marketing theo ROI."
    },
    {
      "module": "M6",
      "name": "Lãnh đạo trong môi trường TMĐT",
      "desc": "T6",
      "duration": "Coaching GĐ trong startup TMĐT tốc độ cao. Xây OKR có chất lượng. Ra quyết định với thông tin không đầy đủ. Văn hóa accountability trong đội ngũ TMĐT."
    },
    {
      "module": "M7",
      "name": "Quan hệ đối tác & Đàm phán",
      "desc": "T7",
      "duration": "Đàm phán với AM sàn (Shopee/TikTok/Lazada): làm thế nào để được ưu tiên campaign, spotlight, credit ads. Đàm phán với NCC: điều kiện thanh toán, exclusivity, MOQ."
    },
    {
      "module": "M8",
      "name": "Tổng kết & Chiến lược năm tới",
      "desc": "T8",
      "duration": "CEO trình bày chiến lược năm tới với BGĐ: GMV target, kênh, tổ chức, đầu tư. Nhận feedback từ GĐ. Cascade xuống OKR năm."
    }
  ]
};
