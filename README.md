# 1. 커스텀 이슈 템플릿
>[Note]
> 템플릿은 깃 이그노어와 같이 개발 준비 단계에서 들어가는 것이 좋습니다.<br> 
> 해당 템플릿 제작 이후 <b>메인 푸시</b>가 필요하기 때문입니다.

해당 저장소에서 프로젝트 이슈 양식을 제공합니다.<br>
이슈 사용시 형식을 지정하여, 일관성있는 이슈 작성을 유도합니다.


깃 메인에서 ``Setting`` 탭 클릭<br>
<img src=".\Image\GoTem1.png"/><br>
<br><br>

``Feature``에서 ``Set up templates``<br>
<img src=".\Image\GoTem2.png"/><br>
<br><br>

``Add Templete``클릭 하고 ``Set up templates``<br>
<img src=".\Image\GoTem3.png"/><br>
<br><br>

우리는 먼저 버그 이슈 템플릿을 작성할 것입니다.<br>
``Bug report``클릭 하고 ``Preview and Edit``으로 수정 모드로 갑니다.<br>
<img src=".\Image\GoTem3.png"/><br>
<img src=".\Image\GoTem4.png"/><br>
<br><br>

뭐가 많을 텐데 다 무시하고 연필 아이콘을 클릭합니다.<br>
<img src=".\Image\GoTem5.png"/><br>
<br><br>

이제 버그 이슈 양식을 수정하면 됩니다.<br>
그런데 양식 뭐 적을지 모르겠죠? 그래서 일단 임시 양식을 올리겠습니다.<br>
```
제목|내용|설명|
|------|---|---|
|ex. 메모리 누수|ex. Player 소멸 과정에서 누수 발견|ex. CPlayer.cpp 72, CBufferCom 연관 버퍼|

## ❗️버그 설명
> 버그가 무엇인지 명확하고 간결하게 작성해주세요.
1. ...
2. ...

## 예상되는 해결책
> 문제를 어떻게 해결 할 수 있을지 작성해주세요.
1. ...
2. ...

## 문제에 대한 다른 정보를 작성해주세요.
>추가 정보 (에러 로그, 스크린샷)
```
다음으로 똑같이 ``Feature Templete``를 누르고 개발 템플릿을 수정합니다.<br>
```
제목|내용|설명|
|------|---|---|
|ex. UI 추가|ex. 버튼 UI 추가|ex. 캡쳐 기능, 함수 연결|

## ❗️기능 설명
> 이 기능이 무엇인지 간략하게 설명해주세요. 이 기능이 프로젝트에 어떤 가치를 더할 수 있을지 설명해주세요.
- [ ] ex. 플레이어 스테이터스
- [ ] ex. UI 관리 객체 추가

## 기대할 효과
> 플레이어가 움직일 수 있다. 코드 패턴이 더 단조로워진다.
1. ...
2. ...

## 추가 정보
> 기능에 대한 다른 정보를 작성해주세요. (아이디어 스케치, 기획 자료)
```

마지막으로 제일 중요합니다.
우상단 작은 버튼 ``purpose changes``를 통해 병합을 해줘야 합니다!<br>
<img src=".\Image\GoTem6.png"/><br>

해당 사항이 올바르게 모두 완료되면 ``Issue``탭에서 템플릿이 제공됩니다.<br>
<img src=".\Image\GoTem7.png"/><br>

### 풀 리퀘스트 템플릿
풀 리퀘스트 템플릿은 다른 템플릿과는 성질이 다릅니다.<br> 
1개만 만들어서 사용가능하며 이름이 강제됩니다.
먼저 파일을 ``pull_request_template.md``로 생성합니다.
> 이때 경로는 ``.github`` 하위에 위치하게 하시면 됩니다.

pr에 적용할 양식 이걸 ``pull_request_template.md``에 작성해 주세요.
```
## 작업내용
> 작업한 내용 설명을 해주세요.
1. ..

## 작업 내용 관련 이슈
> ``#``를 통해서 이슈를 멘션해주세요. ex. # 32
1. ..

## PR 체크리스트
> 아래 사항을 모두 수행했는지 확인해 주세요.
- [ ] 풀 리퀘스트 대상 브랜치가 올바른지 확인해주세요.
- [ ] 누수가 없고 로컬 빌드가 잘 완료되었습니다.
- [ ] PR 하기 전 dev 브랜치를 최신화 했습니다.
- [ ] title, labels, assignees을 채우고 이슈를 연결했습니다.
```

<img src=".\Image\GoTem8.png"/><br>

올바르게 동작하면 템플릿이 적용되어 pr작성이 제공됩니다. 

<img src=".\Image\GoTem9.png"/><br>


> Warn 자동 배포 안해도 될거 같으니 위 사항만 해도 될거 같습니다.<br>
> 만약 하실거라면 깃 토큰 방식 사용이 요구될 수 있습니다. 다른 방식 있던거 같은데 잘 모르겠어요.

## 버전 관리 자동화
> [중요!] 먼저 major, minor, patch 3가지 요소는 알고 오시면 매우 좋습니다.

기존 Release 방식은 내가 직접 main에 적용된 것들을 Release 탭에가서 하는 방식이라면, <br>
드레프터는 라벨을 통한 기능 업데이트 분리와 main 푸시 시 자동으로 Release를 생성해 줍니다.<br>

버전 관리의 요소는 설명하기 보다는 적용법만 간단하게 하겠습니다.<br>
깃 마켓플레이스에 제공하는 ``release_drafter``를 사용하기 위해서는 2가지 파일이 필요합니다.
<br>(아직까진 무료 6버전 25.11.14기준)

<br><br>

1. `` release-drafter.yml`` 위치와 코드 (release-drafter api 가져와야함 접근도 허용하고)
    -  경로는 ```.github/workflows/release-drafter.yml```
```
name: Release Drafter

on:
  push:
    branches:
      - main

  pull_request:
    types: [opened, reopened, synchronize]

permissions:
  contents: write
  pull-requests: write
  
jobs:
  update_release_draft:
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - uses: release-drafter/release-drafter@v6
        with:
           config-name: release-drafter-config.yml
           disable-autolabeler: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
<img src=".\Image\rd1.png"/><br>

<br><br>

2. `` release-drafter-config.yml`` 위치와 코드 (release시 사용할 구성 요소 코드)
    -  경로는 ```.github/release-drafter-config.yml```
```
paginatePath: pullRequests.edges.node

name-template: 'MockUp Moonlighter v$RESOLVED_VERSION'
tag-template: '🔖 v$RESOLVED_VERSION Updates'
categories:
  - title: '✨ 추가된 기능'
    labels:
      - 'enhancement'
  - title: '🐛 버그 픽스'
    labels:
      - 'bug'
      - 'fix'
  - title: '🔧 코드 개선'
    label:
      - 'chore'
      - 'refactor'
change-template: '- $TITLE @$AUTHOR (#$NUMBER)'
change-title-escapes: '\<*_&' # You can add # and @ to disable mentions, and add ` to disable code blocks.
version-resolver:
  major:
    labels:
      - 'major'
  minor:
    labels:
      - 'minor'
  patch:
    labels:
      - 'patch'
  default: patch
template: |
  ## No Lable Changes

  $CHANGES
```

<br><br>

> major, minor, patch 라벨에 따라 버전이 수정되고 아무것도 안달면 기본 patch로 들어가게 됩니다.
> 해당 release drafter 사용 시 라벨을 통한 엑션이 강요됩니다.
> 라벨 없으면 제작 하셔야 합니다. 

<br><br>

라벨 추가 삭제 위치
<img src=".\Image\rd3.png"/><br>

<br><br>

액션이 올바르게 작동하는지는 Action 탭에서 확인할 수 있습니다.<br>
<img src=".\Image\rd4.png"/><br>
<img src=".\Image\rd5.png"/><br>
