import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_skyflow_architecture_final():
    # Увеличиваем высоту до 15, чтобы избежать "каши"
    fig, ax = plt.subplots(figsize=(9, 15))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 105)
    ax.axis('off')

    # ================= ПАЛИТРА (Soft Material Design) =================
    colors = {
        'client':  '#E1F5FE', # Light Blue
        'front':   '#BBDEFB', # Blue
        'proxy':   '#FFF9C4', # Yellow
        'back_bg': '#F1F8E9', # Light Green Container
        'go':      '#C8E6C9', # Green
        'logic':   '#DCEDC8', # Pale Green
        'dal':     '#AED581', # Darker Green
        'db':      '#FFE0B2', # Orange
        'infra':   '#F5F5F5', # Grey
        'border':  '#546E7A', # Slate Grey
        'text':    '#263238'  # Dark Grey
    }

    # ================= ФУНКЦИЯ ОТРИСОВКИ БЛОКОВ =================
    def draw_styled_box(x, y, w, h, color, title, content_list=None,
                        edgecolor=colors['border'], fontsize=8, title_bold=True,
                        shadow=True):

        # 1. Тень
        if shadow:
            shadow_patch = patches.FancyBboxPatch(
                (x+0.5, y-0.5), w, h, boxstyle="round,pad=0.2",
                ec="none", fc="#ccc", alpha=0.3, zorder=1
            )
            ax.add_patch(shadow_patch)

        # 2. Сам блок
        box = patches.FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.2",
            linewidth=1.2, edgecolor=edgecolor, facecolor=color, zorder=2
        )
        ax.add_patch(box)

        # 3. Заголовок
        if title:
            fw = 'bold' if title_bold else 'normal'
            # Если есть контент, поднимаем заголовок выше
            text_y = y + h - 2.5 if content_list else y + h/2
            va = 'top' if content_list else 'center'

            ax.text(x + w/2, text_y, title, ha='center', va=va,
                    fontsize=fontsize+1, fontweight=fw, color=colors['text'], zorder=3)

        # 4. Контент (список)
        if content_list:
            step = 1.8  # Шаг строки

            # Если заголовка нет, начинаем писать выше (ближе к верхней границе)
            # Если заголовок есть, отступаем больше (5.0)
            top_margin = 5.0 if title else 1.5
            start_y = y + h - top_margin

            for item in content_list:
                ax.text(x + w/2, start_y, item, ha='center', va='top',
                        fontsize=fontsize, color='#37474F', zorder=3)
                start_y -= step

    # ================= ФУНКЦИЯ СТРЕЛОК =================
    def draw_arrow(x, y_start, y_end, label=None):
        # Рисуем стрелку
        ax.annotate('', xy=(x, y_end), xytext=(x, y_start),
                    arrowprops=dict(arrowstyle='->', color=colors['border'], lw=1.5), zorder=2)

        # Если есть подпись на стрелке (например, HTTP, SQL)
        if label:
            # Белая плашка, чтобы текст читался на фоне стрелки
            bbox = dict(boxstyle="square,pad=0.2", fc="white", ec="none", alpha=0.9)
            ax.text(x, (y_start + y_end)/2, label, ha='center', va='center',
                    fontsize=7, color='#455A64', bbox=bbox, zorder=3)

    # ЗАГОЛОВОК
    ax.text(50, 102, "АРХИТЕКТУРНАЯ СХЕМА SKYFLOW", fontsize=14, fontweight='bold', ha='center', color='#333')

    # ================= 1. CLIENTS =================
    y_cli = 93
    h_cli = 6

    # Заголовок группы
    ax.text(50, y_cli + h_cli + 1, "КЛИЕНТСКИЕ УСТРОЙСТВА", fontsize=9, fontweight='bold', ha='center', color='#777')

    # 3 блока устройств
    devices = [
        ("Компьютеры", "(Web)"),
        ("Смартфоны", "(Mobile)"),
        ("Планшеты", "(Tablet)")
    ]
    positions = [18, 50, 82]

    for (title, sub), pos_x in zip(devices, positions):
        draw_styled_box(pos_x-9, y_cli, 18, h_cli, colors['client'], title=title, content_list=[sub], fontsize=8, shadow=True)
        # Ножка вниз
        ax.plot([pos_x, pos_x], [y_cli, y_cli-1], color=colors['border'], lw=1)

    # ================= 2. FRONTEND & PROXY =================
    # React App
    y_front = 76
    h_front = 14
    front_stack = [
        "React SPA",
        "TypeScript | Tailwind CSS",
        "React Router",
        "Axios (HTTP)",
        "Zustand (State)"
    ]
    draw_styled_box(20, y_front, 60, h_front, colors['front'], "ВЕБ-БРАУЗЕР / PWA", front_stack)

    # Стрелка Client -> Front
    draw_arrow(50, y_cli-1, y_front+h_front)

    # Proxy
    y_proxy = 63
    h_proxy = 10
    proxy_stack = ["Nginx", "Static Files (dist)", "SSL Termination"]
    draw_styled_box(25, y_proxy, 50, h_proxy, colors['proxy'], "ОБРАТНЫЙ ПРОКСИ / BALANCER", proxy_stack)

    # Стрелка Front -> Proxy
    draw_arrow(50, y_front, y_proxy+h_proxy, "HTTP(S)")

    # ================= 3. BACKEND CONTAINER =================
    y_back_container = 18
    h_back_container = 40

    # Контейнер Бэкенда
    draw_styled_box(10, y_back_container, 80, h_back_container, colors['back_bg'],
                    title="СЕРВЕРНАЯ ЧАСТЬ (BACKEND)", fontsize=10, shadow=False)

    # Внутренности Бэкенда (сверху вниз)

    # 3.1 Go Server
    y_go = 49
    draw_styled_box(20, y_go, 60, 7, colors['go'], "Go HTTP Server (8080)", ["Chi Router | JWT | CORS"])

    draw_arrow(50, y_proxy, y_go+7, "API Requests")

    # 3.2 Logic
    y_logic = 39
    draw_styled_box(20, y_logic, 60, 7, colors['logic'], "Application Layer", ["Flight Mgmt | Auth | Valid"])

    draw_arrow(50, y_go, y_logic+7, "Business Logic")

    # 3.3 DAL
    y_dal = 29
    draw_styled_box(20, y_dal, 60, 7, colors['dal'], "Data Access Layer", ["Repos | SQL Builder"])

    draw_arrow(50, y_logic, y_dal+7, "Data Access")

    # 3.4 DB (Внутри Backend, внизу)
    y_db = 20
    draw_styled_box(25, y_db, 50, 6, colors['db'], "DATABASE (PostgreSQL 15)", ["flights, users | Indexes | FKs"])

    draw_arrow(50, y_dal, y_db+6, "SQL")

    # ================= 4. ИНФРАСТРУКТУРА (Footer) =================
    y_infra = 2
    h_infra = 13

    # Рамка Инфраструктуры
    draw_styled_box(5, y_infra, 90, h_infra, colors['infra'], title="",     shadow=False, edgecolor='#B0BEC5')
    ax.text(30, (y_infra+1) + h_infra, "ИНФРАСТРУКТУРА", fontsize=10, fontweight='bold', ha='center', color='#555')

    # Верхний ряд (Docker components) - ПОДНЯЛИ ЧУТЬ ВЫШЕ (y_infra+8.5 вместо 7)
    infra_top = ["Docker Compose", "Docker Engine", "Volume (pg)"]
    x_pos = [20, 50, 80]

    for item, x in zip(infra_top, x_pos):
        draw_styled_box(x-9, y_infra+8.5, 18, 3.5, '#ECEFF1', title=item, fontsize=7.5, title_bold=False, shadow=True)
        # Связь вниз
        ax.plot([x, x], [y_infra+8.5, y_infra+7.5], color='#B0BEC5', lw=1)

    # Нижний блок (Container List) - УВЕЛИЧИЛИ ВЫСОТУ и ОБНОВИЛИ ТЕКСТ
    # h=5 вместо 4, чтобы вместить две строки свободно
    # Текст разбит на две строки: Контейнеры и Сеть
    infra_content = [
        "Containers: frontend (nginx), backend (go), db (pg)",
        "Network: skyflow-net"
    ]
    draw_styled_box(15, y_infra+2.5, 70, 5, 'white', title="",
                    content_list=infra_content, fontsize=8, shadow=True)

    plt.tight_layout()
    plt.savefig('skyflow_architecture_final.png', dpi=300, bbox_inches='tight')
    plt.show()

if __name__ == "__main__":
    draw_skyflow_architecture_final()
