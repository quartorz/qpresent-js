<!-- .slide: class="qpresent-title" -->

# タイトル

## 作者<br>所属


---

# PDF

- [Chrome~で変換したやつ](http://gh-pages.quart.red/qpresent-js/chrome.pdf)
- [Firefox~で変換したやつ](http://gh-pages.quart.red/qpresent-js/firefox.pdf)

---

# 装飾

**bold, 太字**  
*emphasis, 強調*

---

# 箇条書き

- Item 1
- Item 2
- Item 3

---

# 番号付きリスト

1. アイテム1

1. アイテム2

1. アイテム3

---

# beamer~の~block~みたいなやつ

<p>
<div class="block" block-type="default">
  <div class="block-title">タイトル</div>
  <div class="block-content">
  * 内容
  </div>
</div>
</p>

<p>
<div class="block" block-type="alert">
  <div class="block-title">タイトル</div>
  <div class="block-content">
  * 内容
  </div>
</div>
</p>

<p>
<div class="block" block-type="example">
  <div class="block-title">タイトル</div>
  <div class="block-content">
  * 内容
  </div>
</div>
</p>

<p>
<div class="block" block-type="example">
  <div class="block-content">
  * タイトルなし
  </div>
</div>
</p>

---

# 数式

inline: $f(x) = x^2 + 2x + 1$  
display:
\\[
    g(x) = x^2 + 6x + 9.
\\]

---

# ブロックと数式

<p>
<div class="block" block-type="example">
  <div class="block-title">例</div>
  <div class="block-content">
  - inline: $f(x)$
  - display: $$f(x)$$
  </div>
</div>
</p>

---

# プログラム

C++

```cpp
#include <iostream>

template <typename T>
void func();

int main()
{
    std::cout << "hello, world" << std::endl;
}
```

Python

```python3
import sys

print('hello, world')
print(sys.argv)
```