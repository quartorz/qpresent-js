<!-- .slide: class="qpresent-title" -->

# タイトル

## 作者<br>所属


------

# PDF

- [Chrome~で変換したやつ](http://gh-pages.quart.red/qpresent-js/chrome.pdf)
- [Firefox~で変換したやつ](http://gh-pages.quart.red/qpresent-js/firefox.pdf)

------

# 装飾

**bold, 太字**  
*emphasis, 強調*

------

# 箇条書き

- Item 1
- Item 2
- Item 3

------

# 番号付きリスト

1. アイテム1

1. アイテム2

1. アイテム3

------

# 2~段組み

----

- 左

----

- 右

----

------

# beamer~の~block~みたいなやつ

***
タイトル
***
* 内容
***

***
タイトル
***
* 内容
***
<!-- .element: block-type="alert" -->

***
タイトル
***
* 内容
***
<!-- .element: block-type="example" -->

***
***
* タイトルなし
***
<!-- .element: block-type="example" -->

------

# 数式

inline: $f(x) = x^2 + 2x + 1$  
display:
\\[
    g(x) = x^2 + 6x + 9.
\\]

------

# ブロックと数式

***
例
***
- inline: $f(x)$
- display: $$f(x)$$
***
<!-- .element: block-type="example" -->

------

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
