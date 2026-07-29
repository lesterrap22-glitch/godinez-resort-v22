Drop real photos here (e.g. villa-milagros.jpg, pool-main.jpg, restaurant.jpg).

Then add a "photoUrl" field pointing to it in the matching item inside
server/content/*.json - for example, in server/content/villas.json:

  {
    "id": "villa-milagros",
    "name": "Milagros Villa",
    "photoUrl": "images/villa-milagros.jpg",
    ...
  }

That's it - no other code changes needed. The front-end (public/js/main.js,
see the cardMedia() function) automatically shows a real photo instead of the
icon illustration whenever an item has a "photoUrl". This works the same way
for villas, pools, the restaurant, activities, and tours.

Tips:
- Keep photos reasonably sized for the web (roughly 1200-1600px wide is
  plenty) so pages load quickly. If a photo comes straight off a phone/camera
  it may be several MB - resizing it first (Preview app: Tools > Adjust Size)
  helps a lot.
- You can optionally add a "photoCredit" field too (shown as a small caption
  in the corner of the photo) - useful if a photo isn't yours to use freely,
  or just to credit whoever took it.
