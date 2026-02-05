# 배포 가이드

## 서버 정보

- **서버 IP**: 3.26.225.195
- **SSH 키**: `ssr-mycalendar-server-key.pem` (프로젝트 루트)
- **사용자**: ubuntu
- **도메인**: https://ticketstage.co.kr

## 백엔드 배포

### 1. 빌드

```bash
cd backend
JAVA_HOME=/Users/wd/Library/Java/JavaVirtualMachines/temurin-17.0.17/Contents/Home ./gradlew build -x test
```

### 2. 서버로 파일 복사

```bash
scp -i ssr-mycalendar-server-key.pem backend/build/libs/backend-0.0.1-SNAPSHOT.jar ubuntu@3.26.225.195:~/backend-0.0.1-SNAPSHOT.jar
```

### 3. 서버 재시작

```bash
# 서버 접속
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195

# 실행 중인 프로세스 확인
ps aux | grep java

# 프로세스 종료 및 재시작 (PID는 위에서 확인한 값으로 대체)
sudo kill -9 <PID> && sleep 2 && cp ~/backend-0.0.1-SNAPSHOT.jar ~/backend.jar && nohup java -jar ~/backend.jar > ~/backend.log 2>&1 &
```

### 한 줄 배포 (로컬에서)

```bash
# 빌드 + 복사 + 재시작
cd /Users/wd/IdeaProjects/happy1 && \
JAVA_HOME=/Users/wd/Library/Java/JavaVirtualMachines/temurin-17.0.17/Contents/Home ./backend/gradlew -p backend build -x test && \
scp -i ssr-mycalendar-server-key.pem backend/build/libs/backend-0.0.1-SNAPSHOT.jar ubuntu@3.26.225.195:~/backend-0.0.1-SNAPSHOT.jar && \
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "PID=\$(pgrep -f 'java -jar.*backend.jar') && sudo kill -9 \$PID; sleep 2 && cp ~/backend-0.0.1-SNAPSHOT.jar ~/backend.jar && nohup java -jar ~/backend.jar > ~/backend.log 2>&1 &"
```

## 로그 확인

```bash
# 서버 접속 후
tail -f ~/backend.log

# 또는 로컬에서
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "tail -100 ~/backend.log"
```

## 서버 상태 확인

```bash
# 프로세스 확인
ssh -i ssr-mycalendar-server-key.pem ubuntu@3.26.225.195 "ps aux | grep java"

# API 헬스체크
curl https://ticketstage.co.kr/api/teams
```
