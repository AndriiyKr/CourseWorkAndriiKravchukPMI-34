from django.urls import path
from .views import (
    AnalyzeGraphView, 
    SolveGraphView, 
    DijkstraView, 
    FloydView,
    TraverseView
)

urlpatterns = [
    path('analyze/', AnalyzeGraphView.as_view()),
    path('solve/', SolveGraphView.as_view()),
    path('dijkstra/', DijkstraView.as_view()),
    path('floyd/', FloydView.as_view(), name='floyd'),
    path('traverse/<str:type>/', TraverseView.as_view()),
]