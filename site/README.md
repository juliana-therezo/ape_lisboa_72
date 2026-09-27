# Site Ape Lisboa 72

Site de divulgação e reservas do apartamento T1 em Penha de França (Lisboa), em 5 línguas:
Português (PT), Português (BR), Inglês (UK), Espanhol e Francês.

## O que tem no site

- Logo e cores do apartamento (verde-escuro `#16371c`, dourado `#e8a107`, verde-sálvia `#adb7a4`)
- Descrição, comodidades, galeria de fotos com ampliação e secção de vídeo
- Localização (Praça Paiva Couceiro, metro Arroios/Alameda, autocarro)
- Calendário de disponibilidade com seleção de datas, estadia mínima de 30 noites e estimativa de preço
- Formulário de pedido de reserva (chega ao seu e-mail via Netlify Forms)
- Links para os anúncios na Uniplaces e na Spotahome e para o Instagram @ape.lisboa72
- Modo escuro automático e layout para telemóvel

## Estrutura

```
index.html                      site completo (HTML + CSS + JS)
availability.json               datas ocupadas de reserva (usado se a sincronização falhar)
assets/img/                     logo, favicon e fotos
assets/video/tour.mp4           vídeo do apartamento
netlify/functions/availability.mjs   junta os calendários iCal
netlify.toml                    configuração do Netlify
```

## Publicar (grátis, ~10 minutos)

1. Crie uma conta em https://app.netlify.com
2. **Add new site → Deploy manually** e arraste esta pasta inteira. (Para a função de calendário funcionar, o ideal é ligar a pasta a um repositório GitHub e usar **Import from Git**; o deploy manual por arrastar não publica funções.)
3. Em **Forms**, ative a deteção de formulários. Em **Forms → Notifications**, adicione o seu e-mail para receber cada pedido de reserva.
4. Opcional: em **Domain management**, ligue um domínio próprio (ex.: apelisboa72.com).

## Sincronizar o calendário

A Uniplaces **só importa** calendários iCal; não exporta. Por isso o esquema recomendado usa um calendário principal (Google Calendar) no centro:

```
Google Calendar "Ape Lisboa 72" (principal)
   ├──► importado pela Uniplaces  (bloqueia datas lá)
   ├──► importado pela Spotahome  (bloqueia datas lá)
   └──► lido pelo site            (mostra datas ocupadas)
Spotahome (link de exportação iCal) ──► lido pelo site e importado no Google Calendar
```

Passos:

1. No Google Calendar, crie um calendário "Ape Lisboa 72". Em **Definições → Integrar calendário**, copie o **Endereço secreto no formato iCal**.
2. **Uniplaces**: em ap.uniplaces.com/listings → Edit → *Update the Availability*, cole o link do Google e clique em *Sync calendar* → *Save*.
3. **Spotahome**: no painel de proprietário, na sincronização de calendário do anúncio, importe o mesmo link do Google. Se a Spotahome oferecer um link de exportação `.ics`, copie-o também.
4. **Netlify → Site configuration → Environment variables**: crie `ICAL_URLS` com os links separados por vírgula, por exemplo:
   `https://calendar.google.com/calendar/ical/.../basic.ics,https://...spotahome....ics`
5. Faça novo deploy. O site passa a mostrar "Sincronizado com Uniplaces e Spotahome · atualizado …".

Quando chegar uma reserva pela Uniplaces (ou pelo site), adicione o período como evento no Google Calendar. A Spotahome e o site atualizam-se sozinhos; a Uniplaces sincroniza de forma agendada, não instantânea.

Sem `ICAL_URLS` configurado, o site usa `availability.json` (hoje: ocupado até 18/12/2026, disponível a partir de 19/12/2026, conforme os anúncios).

## Personalizar

No início do `<script>` do `index.html`, no objeto `CONFIG`:

- `monthlyPrice` – preço mensal mostrado (1500 €)
- `minNights` – estadia mínima (30)
- `photos` – lista de fotos da galeria (ficheiros em `assets/img/fotos/`, com o nome da divisão).
- `video` – vídeo do apartamento (`assets/video/tour.mp4`, capa em `poster.jpg`).

Os textos das 5 línguas estão no objeto `T`, logo abaixo.
