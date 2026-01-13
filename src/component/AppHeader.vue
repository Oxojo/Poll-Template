<template>
    <div class="header">
        <div class="container">
            <div class="top">
                <a href="https://poll-template.trap.show/">Schedule-Poll</a>
            </div>
            <div class="info">
                <a href="https://poll-template.trap.show/info">
                    <img src="../../info.png" alt="">
                </a>
            </div>
        </div>
            
    </div>
</template>
<style>
.header {
    display: flex;
    width: 100vm;
    height: 30px;
    padding: 14px 23px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    background: rgba(236, 160, 170, 0.30);
}
.container {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
}
.top {
    color: #000;
    font-family: "Zen Maru Gothic";
    font-size: 20px;
    font-style: normal;
    font-weight: 1000;
    line-height: normal;
}
a {
  color: inherit !important;
  text-decoration: none !important;
}
a:visited, a:hover, a:active {
  color: inherit !important;
  text-decoration: none !important;
}
</style>
