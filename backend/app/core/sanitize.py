"""Rich text sanitisation for product descriptions (S14-S15).

`ProductDetail.jsx` renders `product.long_description` with
`dangerouslySetInnerHTML`, so whatever HTML is stored in that field is
executable markup. The field stays rich text on purpose: instead of flattening
it to plain text, the server cleans it against a tight allowlist.

Two places call this: the product write schemas (so new rows are stored clean,
S14) and the product detail endpoints (so rows written before this change are
clean on read, S15).
"""

from typing import Optional

import nh3

# Formatting-oriented subset: no <img>, <iframe>, <video>, <style> or <script>.
RICH_TEXT_TAGS = {
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "blockquote",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "a",
}

# No styling hooks: links keep href/title and every other tag loses all of its
# attributes. `rel` is not listed on purpose: nh3 rejects it while `link_rel` is
# set, and it injects "noopener noreferrer" on every link by itself.
RICH_TEXT_ATTRIBUTES = {"a": {"href", "title"}}

RICH_TEXT_URL_SCHEMES = {"http", "https", "mailto"}

# Tags removed together with their content instead of being unwrapped, so the
# payload of an inline script never survives as escaped text.
RICH_TEXT_CLEAN_CONTENT_TAGS = {"script", "style"}


def _allowed_attribute(element: str, attribute: str, value: str) -> Optional[str]:
    """Keep only the documented link attributes, drop everything else.

    This repeats `RICH_TEXT_ATTRIBUTES` on purpose: it makes the allowlist
    independent of any generic attribute prefix (`data-*`, `aria-*`, ...) the
    sanitiser might allow by default.
    """
    if element == "a" and attribute in RICH_TEXT_ATTRIBUTES["a"]:
        return value
    return None


def sanitize_rich_text(value: Optional[str]) -> Optional[str]:
    """Return `value` cleaned with the rich-text allowlist.

    `None` and empty strings are returned untouched so an absent description
    stays absent. Everything outside the allowlist is stripped: unknown tags,
    every event handler (`on*`) and every URL whose scheme is not http, https or
    mailto.

    The function is pure and idempotent, which is why it can be applied both on
    write and on read.
    """
    if not value:
        return value

    return nh3.clean(
        value,
        tags=RICH_TEXT_TAGS,
        clean_content_tags=RICH_TEXT_CLEAN_CONTENT_TAGS,
        attributes=RICH_TEXT_ATTRIBUTES,
        attribute_filter=_allowed_attribute,
        url_schemes=RICH_TEXT_URL_SCHEMES,
        generic_attribute_prefixes=set(),
        link_rel="noopener noreferrer",
        strip_comments=True,
    )
