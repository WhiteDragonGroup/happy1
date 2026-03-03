# 배포 가이드

## 서버 정보

| 항목 | 값 |
|------|---|
| 서버 IP | `3.26.225.195` |
| SSH 키 | `ssr-mycalendar-server-key.pem` (프로젝트 루트) |
| 사용자 | `ubuntu` |
| 도메인 | https://ticketstage.co.kr |
| 프론트엔드 | `/var/www/html` (nginx) |
| 백엔드 | `~/backend.jar` (Spring Boot, 포트 8080) |
| 환경변수 | `~/backend.env` |
| 로그 | `~/backend.log` |

## SSH 접속

```bash
cd /Users/wd/IdeaProjects/happy1
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195
```

---

## 전체 배포 (프론트 + 백엔드)

프로젝트 루트(`/Users/wd/IdeaProjects/happy1`)에서 실행:

```bash
# 1. 백엔드 빌드 + 배포
JAVA_HOME=/Users/wd/Library/Java/JavaVirtualMachines/temurin-17.0.17/Contents/Home \
./backend/gradlew -p backend build -x test && \
scp -i ssr-mycalendar-server-key.pem \
  backend/build/libs/backend-0.0.1-SNAPSHOT.jar \
  ubuntu@3.26.225.195:~/backend-0.0.1-SNAPSHOT.jar && \
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  'pkill -f "java -jar.*backend" || true; sleep 2; \
   cp ~/backend-0.0.1-SNAPSHOT.jar ~/backend.jar; \
   export $(cat ~/backend.env | xargs) && \
   nohup java -jar ~/backend.jar > ~/backend.log 2>&1 &'

# 2. 프론트엔드 빌드 + 배포
cd frontend && npm run build && cd .. && \
scp -i ssr-mycalendar-server-key.pem -r \
  frontend/dist/* ubuntu@3.26.225.195:/tmp/frontend-dist/ && \
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  'sudo rm -rf /var/www/html/* && sudo cp -r /tmp/frontend-dist/* /var/www/html/'
```

---

## 백엔드만 배포

```bash
cd /Users/wd/IdeaProjects/happy1

# 빌드
JAVA_HOME=/Users/wd/Library/Java/JavaVirtualMachines/temurin-17.0.17/Contents/Home \
./backend/gradlew -p backend build -x test

# 서버로 복사
scp -i ssr-mycalendar-server-key.pem \
  backend/build/libs/backend-0.0.1-SNAPSHOT.jar \
  ubuntu@3.26.225.195:~/backend-0.0.1-SNAPSHOT.jar

# 재시작 (환경변수 포함)
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  'pkill -f "java -jar.*backend" || true; sleep 2; \
   cp ~/backend-0.0.1-SNAPSHOT.jar ~/backend.jar; \
   export $(cat ~/backend.env | xargs) && \
   nohup java -jar ~/backend.jar > ~/backend.log 2>&1 &'
```

## 프론트엔드만 배포

```bash
cd /Users/wd/IdeaProjects/happy1

# 빌드
cd frontend && npm run build && cd ..

# 서버로 복사 + 교체
scp -i ssr-mycalendar-server-key.pem -r \
  frontend/dist/* ubuntu@3.26.225.195:/tmp/frontend-dist/
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  'sudo rm -rf /var/www/html/* && sudo cp -r /tmp/frontend-dist/* /var/www/html/'
```

---

## 운영

### 로그 확인

```bash
# 실시간 로그
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "tail -f ~/backend.log"

# 최근 로그 100줄
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "tail -100 ~/backend.log"

# 에러만 확인
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "grep -i error ~/backend.log | tail -20"
```

### 서버 상태 확인

```bash
# 백엔드 프로세스 확인
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "ps aux | grep java | grep -v grep"

# API 헬스체크
curl https://ticketstage.co.kr/api/teams

# nginx 상태
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "sudo systemctl status nginx"

# 디스크 / 메모리
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "df -h && echo '---' && free -h"
```

### 백엔드 재시작 (코드 변경 없이)

```bash
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  'pkill -f "java -jar.*backend" || true; sleep 2; \
   export $(cat ~/backend.env | xargs) && \
   nohup java -jar ~/backend.jar > ~/backend.log 2>&1 &'
```

### nginx 재시작

```bash
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "sudo systemctl restart nginx"
```

---

## 환경변수

서버의 `~/backend.env` 파일에 저장됨 (chmod 600):

| 변수 | 설명 |
|------|------|
| `DB_URL` | MySQL 접속 URL |
| `DB_USERNAME` | DB 사용자명 |
| `DB_PASSWORD` | DB 비밀번호 |
| `JWT_SECRET` | JWT 서명 키 |
| `KAKAO_REST_API_KEY` | 카카오 로그인 API 키 |
| `AWS_ACCESS_KEY` | AWS S3 액세스 키 |
| `AWS_SECRET_KEY` | AWS S3 시크릿 키 |
| `AWS_S3_BUCKET` | S3 버킷명 |
| `AWS_REGION` | AWS 리전 |

환경변수 수정:
```bash
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "nano ~/backend.env"
```

---

## 서버 구조

```
/home/ubuntu/
  backend.jar          # 실행 중인 백엔드
  backend-0.0.1-SNAPSHOT.jar  # 최신 업로드된 jar
  backend.env          # 환경변수 (600 권한)
  backend.log          # 애플리케이션 로그

/var/www/html/         # 프론트엔드 (nginx)
  index.html
  assets/

/etc/nginx/sites-enabled/default  # nginx 설정
  - / → /var/www/html (프론트엔드)
  - /api → localhost:8080 (백엔드 프록시)
```

## SSL 인증서 갱신

Let's Encrypt 인증서는 보통 자동 갱신됩니다. 수동 갱신:
```bash
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 \
  "sudo certbot renew && sudo systemctl restart nginx"
```
