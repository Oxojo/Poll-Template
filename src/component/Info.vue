<template>
    <div class="cont">
        <div class="Sec">
            <div class="title">概要</div>
            <div class="desc">　@BOT_SimplePoll を用いたアンケート作成を支援します。<br>　少し構文も複雑で面倒なルールもあるため、作成ミスを防ぐことが目的です。 </div>
        </div>
        <div class="Sec">
            <div class="title">使い方</div>
            <div class="desc">　「タイトル」の欄にはアンケートのタイトルを記入してください。<br>
　「選択肢」の欄には、選択肢に使用するスタンプのスタンプ名と、それに付属する説明文を記入します。各行の左に、入力したスタンプの画像が表示されているので、それも見ながら確認してください。<br>
　すべて記入したら、プレビューの部分で出来上がったメッセージをコピーできます。これをコピーし、自身で投稿したいチャンネルに送信するとうまくいくと思います。</div>
        </div>
        <div class="Sec">
            <div class="title">存在意義</div>
            <div class="desc">　よく使われるサービスである @BOT_SimplePoll のアンケートをより快適に使えるように、との思いで作成していますが、個人的には、日程調整に使えるようなより使いやすいツールが開発されることのほうがより健全であると考えております。そのため、モチベーションの高い若者がより traP 全体に多大な貢献をもたらせるようなプロダクトを開発してくれることを期待します。</div>
        </div>
        <div class="Sec">
            <div class="title">お問い合わせ</div>
            <div class="desc">　基本的に文句は受け付けないため、文句があるなら自分で実装して PR を立ててください。見るかどうかは保証しません。どうしても見る必要がある場合は @Oxojo をメンションしてください。</div>
        </div>
    </div>
</template>
<style>
    .cont {
        display: flex;
        width: 80%;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 36px;
        margin: 1rem auto;
        padding: 0 15px;
        box-sizing: border-box;
    }
    .Sec {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        align-self: stretch;
    }
    .title {
        align-self: stretch;
        color: #000;
        font-family: "Zen Maru Gothic";
        font-size: 32px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
    }
    .desc {
        color: #000;
        font-family: "Zen Maru Gothic";
        font-size: 18px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
    }
</style>