Tule se nahaja koda za spletno aplikacijo in pa nekaj Python skript, povezanih s pridobivanjem, manipulacijo in prikazom podatkov, pridobljenih s spletne strani [promet.si](https://www.promet.si/sl/stevci-prometa), s katero upravlja državno podjetje DARS.


Pomembne skripte:
- `dars_scraper` - pridobi dve vektorski ploščici (angl. *vector tile*) za zajem podatkov o gostoti prometa na območju Ljubljane (11/1106/727 in 11/1106/728, format z/x/y)
- `export_data` - pripravi datoteke, potrebne za delovanje spletne aplikacije (Parquet datoteke pretvori v JSON datoteke po urah - tole ni čisto res, to je počel prej, sedaj pa samo še posodobi `index.json`)


Spletna aplikacija se nahaja v mapi `web`, omogoča animiran prikaz gostote prometa v Ljubljani za izbran datum (od 17.4.2026 naprej) z izbiro hitrosti predvajanja (1x/2x/4x/10x), načina prikaza (kategorično - 4 kategorije (barve zelena-oranžna-rdeča-temno rdeča), kakor jih ima tudi DARS, ali interpolirano - po teh štirih kategorijah) in pa opcijo prikaza vremena po urah (podatki z [Open-Meteo](https://open-meteo.com/), saj sem na [ARSOtu našel arhivske podatke le po dnevih](https://meteo.arso.gov.si/met/sl/agromet/data/month/)).

IMPORTANT NOTE: Aplikacija seveda ne deluje brez prometnih datotek, ki pa jih tu ni (zaradi velikosti). V bližnji prihodnosti moram dodati še link do tega. Sta pa v mapi `traffic/example/` ena Parquet datoteka za cel dan (1.5.2026) in pa ena CSV datoteka taistega dne, a le za enourni interval (od 8:00 do 9:00).

Bližnja prihodnost je tu! [Tole je link do podatkov](https://figshare.com/articles/dataset/Traffic_files/32715492). (Zadnji update podatkov: 17.6.2026)

Še en malo manj important note: trenutno je aplikacija narejena tako, da brskalnik prebere dnevno prometno Parquet datoteko, kar traja nekaj sekund. Branje te datoteke sem prestavil na brskalnik zaradi omejitve RAMa na serverju, kjer imam tudi scraper. Ker je zdaj aplikacija ločena od scraperja, si lahko privoščim, da datoteko preberem že prej. To moram še spremeniti.


Za pravilno delovanje skript boš moral verjetno spremeniti nekatere datotečne poti.

P.S.: Morda boš tudi opazil, da sta meji pri izbiri ure nastavljeni na 02:00, namesto na 00:00, kot bi bilo bolj logično. Razlog za to je enak razlogu za veliko večino drugih čudnosti po internetu: legacy. Ko sem pisal scraper, se mi ni dalo ukvarjati s pretvarjanjem časovnega žiga v slovenski čas in tako sem takrat obdržal UTC, češ, saj ne bo tak problem kasneje pretvoriti 2 uri naprej. In tako smo tu 2 meseca kasneje, ko bi za pravilno delovanje rabil spremeniti vse datoteke ali pa za prikaz posameznega dne naložiti datoteki dveh dni. To se mi je zdelo nesmiselno, zato sedaj aplikacija prikazuje podatke od dveh ponoči izbranega dne do dveh ponoči naslednjega dne. Bom to popravil? Verjetno ne, aplikacija mi je že tako ali tako vzela veliko preveč časa, uporabljal pa je ne bo nihče (tudi jaz ne). Poleg tega pa res nikogar ne zanima, kakšen je bil promet ob enih ponoči.
