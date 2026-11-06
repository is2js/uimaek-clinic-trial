# 의맥전기 진료실 타이머 · Windows 시험판

- [다운로드·사용서](https://is2js.github.io/uimaek-clinic-trial/)
- [시험판 0.1.3 설치 파일](https://is2js.github.io/uimaek-clinic-trial/downloads/PvpLocalClinicTrialSetup-0.1.3.exe)
- [설치 파일 SHA-256 목록](https://is2js.github.io/uimaek-clinic-trial/downloads/SHA256SUMS.txt)

대표 Windows PC 한 대에서 사용하는 진료 타이머입니다. 게임 계정 없이 기본 8개 베드로 시작하며 설치·초기 설정·인증서 등록 동의·사용법·백업·CSV·문제 해결은 위 사용서에서 확인할 수 있습니다. 설치본 사용자에게 Python이나 개발 도구는 필요하지 않습니다.

현재 배포본은 코드 서명이 없는 시험판입니다. 사용하려는 PC의 보안 정책에 따라 설치가 제한될 수 있습니다. 설치 파일의 출처·버전·해시는 확인하되 해시가 코드 서명을 대신하지는 않습니다. 기본 진료실 CA 신뢰 등록은 앱의 안내를 확인하고 사용자가 직접 동의합니다. 일반 앱 개발 채널과 시험판의 설치·자료·PIN·백업은 별도입니다.

## 배포 구성

이 저장소는 GitHub Pages용 정적 결과와 검증된 시험판 설치본을 담습니다. `main`의 루트를 배포 소스로 사용하고 `.nojekyll`로 정적 파일을 제공합니다. 페이지는 `release.json`의 버전·용량·해시를 표시하며 설치 파일과 해시 목록을 같은 사이트에서 제공합니다. 서버 API·로그인·진료 DB는 없습니다. 외부 설치본을 자동 실행하지 않습니다.

RPG 인트로의 한의원 풍경과 종이색·짙은 녹색·금색을 참고했습니다. favicon은 실제 PVP RPG의 `medical-needle-r1` 원본입니다. 같은 원본 ICO가 앱과 설치 EXE에도 포함됩니다. 화면 예시는 가상 데이터이며 실제 환자 자료가 아닙니다. 자세한 출처는 `assets/rpg/local-clinic/trial-site/branding-source.json`과 `preview-source.json`에 기록합니다.

## 내용 갱신

원본 PVP 프로젝트의 `templates/rpg-local-clinic-download.html`, `assets/rpg/local-clinic/trial-site.css`와 가이드를 수정합니다. 시험판 EXE 변경 시 버전을 올리고 기존 클린 빌더의 자체 검사·manifest·해시 확인을 완료한 뒤 내보냅니다.

```powershell
.venv/Scripts/python.exe -X utf8 tools/build_local_clinic_desktop.py --channel trial --version 0.1.3
.venv/Scripts/python.exe -X utf8 tools/export_local_clinic_trial_site.py --output ../uimaek-clinic-trial --base-path ./
```

위 명령은 원본 프로젝트의 개발자용입니다. 내보내기는 관리 표식과 파일 해시를 확인해 변경된 출력이나 무관한 디렉터리를 덮어쓰지 않습니다. 이 저장소의 관리 표식을 유지하고 결과를 수동 편집하지 않습니다. 별도 작업 복사본에서 재생성할 때도 HTML·자산·`release.json`·해시·설치본을 함께 검토합니다.

이 저장소에서 변경 목록과 다운로드 동작을 확인한 뒤 관련 경로만 스테이징하고 커밋해 `main`에 push합니다. 실제 Pages 배포 성공과 인증 없는 HTTPS, 브라우저 다운로드 및 설치본 SHA-256을 확인합니다. PVP 원본 저장소나 인트로 저장소를 이 작업으로 push하지 않습니다.

페이지를 로컬에서 확인하려면 이 저장소 루트에서 아래 명령을 실행하고 `http://127.0.0.1:5186/`을 엽니다. Python은 미리보기 담당자에게만 필요합니다. Ctrl+C로 종료합니다.

```text
python -m http.server 5186 --bind 127.0.0.1
```

HTML 파일을 직접 열면 ES module과 다운로드 조회가 제한될 수 있습니다. HTTP(S)로 제공하세요. `.env`, DB, 키, 로그나 실제 계정·진료 자료는 이 저장소에 추가하지 않습니다.
